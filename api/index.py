from flask import Flask, request, send_file, jsonify, abort
from flask_cors import CORS
import requests
import concurrent.futures
from PIL import Image, ImageDraw, ImageFont
import io
from functools import reduce
import time
import base64
import random

app = Flask(__name__)
CORS(app)

# create collage via PIL


@app.route("/api/collage", methods=['POST', 'GET'])
def hello_world():
    token = ""
    response_data = {}
    if request.method == 'POST':
        data = request.get_json()
        token = data['access_token']
        length = data['length']
        type = data['type']
        format = data['format']
        name = data['name']
        date = data['date']
        collage, mapInfos, status = makeCollage(
            token, type, 50, 0, length, format, name, date)

        if status == 409:
            abort(409)
        start = time.time()
        image_io = io.BytesIO()
        collage.save(image_io, format='JPEG')
        image_io.seek(0)
        print("bytesio time: " + str(time.time() - start), flush=True)

        start = time.time()
        response_data['image'] = base64.b64encode(
            image_io.getvalue()).decode('utf-8')
        print("decode time: " + str(time.time() - start), flush=True)

        response_data['info'] = mapInfos
        response_data['dimensions'] = collage.size

        collage.close()

        return jsonify(response_data)


def makeCollage(auth_token, item_type, limit, offset, time_range, format, name, date):

    req_url = 'https://api.spotify.com/v1/me/top/' + \
        item_type + '?' + 'limit=' + \
        str(limit) + '&offset=' + str(offset) + '&time_range=' + time_range

    # print("req_url", req_url, flush=True)

    response = requests.get(url=req_url, headers={
        "Authorization": "Bearer " + auth_token, "Content-Type": "application/json"})

    # print("response", response.json(), flush=True)
    if not response.ok:
        return None, None, 409
    response = response.json()
    count = 1
    imgSize = 640 if format == "INTERACT" else 596
    albumInfos = set()
    imageLinks, externalLinks, titles = [], [], []
    for i in response['items']:  # cycle through items

        # print info
        if (item_type == 'tracks'):
            info = i['name'] + ' - '
            albumInfo = i['album']['name'] + "-" + \
                i['album']['artists'][0]['name']
            numArtists = len(i['artists'])
            for j in range(0, numArtists):
                info += i['artists'][j]['name']
                if (j != numArtists - 1):
                    info += ', '
        else:
            info = i['name']
            albumInfo = info

        if (item_type == 'tracks'):  # artist or tracks
            pics = i['album']['images']
        else:
            pics = i['images']

        if len(pics) > 0:
            lastImg = pics[0]  # last pic is smallest pixels
            if albumInfo not in albumInfos:
                albumInfos.add(albumInfo)
                imageLinks.append(lastImg['url'])
                externalLinks.append(i['external_urls']['spotify'])
                titles.append(info)

            info += '\n' + lastImg['url']

            count += 1
    images = [""] * len(imageLinks)
    start = time.time()
    with concurrent.futures.ThreadPoolExecutor(len(imageLinks)) as executor:
        i = 0
        for link in imageLinks:
            executor.submit(downloadImg, link, i, images, imgSize)
            i += 1

    print("image downloads done... " + str(len(images)) +
          " images time: " + str(time.time()-start))

    if time_range == "medium_term":
        timeText = "LAST 6 MONTHS"
    elif time_range == "long_term":
        timeText = "LAST YEAR"
    else:
        timeText = "LAST MONTH"

    if item_type == "artists":
        typeText = "TOP ARTISTS"
    else:
        typeText = "TOP TRACKS"
    nameSplit = name.split()

    if len(nameSplit[0]) <= 16:
        nameFinal = nameSplit[0].upper() + "'S "
    else:
        nameFinal = ""

    if format == "INTERACT":
        date = ""
    displayText = [nameFinal.upper(), timeText, typeText, date]

    collage, mapInfos = constructCollage(
        images, imgSize, format, displayText, externalLinks, titles)

    return collage, mapInfos, 200


def drawText(collage: Image, left, upper, right, lower, displayText, textSize, format, logo_disp):
    font = ImageFont.truetype(
        "./public/assets/fonts/ClashDisplay-Semibold.otf", textSize)

    logoFont = ImageFont.truetype(
        "./public/assets/fonts/ClashDisplay-Semibold.otf", 135 if format == "SHARE" else 100)

    leftText = displayText[0] + displayText[2]

    rect = Image.new('RGB', [right - left, lower - upper])
    leftEnd = (len(leftText) - 1) * (textSize * 0.64)
    rightBegin = rect.width - (len(displayText[1]) * (textSize * 0.64))
    date_offset = leftEnd + ((rightBegin - leftEnd) // 2)

    text = Image.new('L', rect.size, 0)
    textDraw = ImageDraw.Draw(text)
    textDraw.text((15, rect.height // 2), leftText,
                  font=font, anchor="lm", fill=255)
    textDraw.text((date_offset, rect.height // 2), displayText[3],
                  font=font, anchor="mm", fill=255)
    textDraw.text((rect.width - 15, rect.height // 2), displayText[1],
                  font=font, anchor="rm", fill=255)

    background = Image.open("./public/assets/images/back_" + format + ".jpg")
    flip = random.randint(0, 1)
    if flip:
        background = background.rotate(180)

    background = background.resize(rect.size)
    toPaste = Image.composite(background, rect, text)

    collage.paste(toPaste, [left, upper])

    if logo_disp:
        urlDraw = ImageDraw.Draw(collage)
        urlOffset = left
        urlDraw.text((urlOffset, collage.height - ((155 if format == "INTERACT" else 180))),
                     "groovygrids.vercel.app", font=logoFont, fill=(0, 0, 0))


def constructCollage(images: list, imgSize: int, format, displayText, externalLinks, titles):
    startCollage = time.time()
    dimensions = getDim(len(images), format)
    cols = dimensions[0]
    rows = dimensions[1]

    xOffset = yOffset = width = fontSize = top = yShareGap = 0
    height = imgSize * rows
    logo_disp = True

    name = displayText[0]

    if format == "SHARE":
        if len(name) > 12:
            fontSize = 74
        elif len(name) > 9:
            fontSize = 81
        else:
            fontSize = 90

        yOffset = 96
        if len(images) >= 32:
            # factor = (height + yOffset) / 16
            # width = factor * 9
            # xOffset = (width - (imgSize * cols)) // 2
            width = 2934
            height = 5216 - yOffset
            xOffset = 261
            yShareGap = 162
            yOffset = 130
        else:
            width = 2934
            xOffset = 187
            logo_disp = False
    elif format == "INTERACT":
        if len(name) > 12:
            fontSize = 68
        else:
            fontSize = 75
        xOffset = 60
        yOffset = 120
        top = 60
        width = imgSize * cols + xOffset * 2

    finalHeight = height + yOffset + top * \
        3 + (60 if format == "INTERACT" else 0)

    print("dimensions: " + str(width) + "x" + str(finalHeight), flush=True)
    collage = Image.new(mode="RGB", size=(int(width), finalHeight))
    swirls = Image.open("./public/assets/images/swirls2.jpeg")

    swirls = swirls.rotate(90 * random.randint(1, 3))

    l = 0
    while l < collage.height:
        collage.paste(swirls, (0, l))
        l += swirls.height
        swirls = swirls.rotate(90)

    imgIndex = 0
    mapInfos = []
    for r in range(0, rows):
        for c in range(0, cols):
            curMapInfo = {}
            if (imgIndex >= len(images)):
                break
            x = imgSize * c + (xOffset)
            y = top + (imgSize * r) + yShareGap
            if r >= 4:
                y += yOffset  # gap for text
            collage.paste(images[imgIndex], (int(x), int(y)))
            curMapInfo['link'] = externalLinks[imgIndex]
            curMapInfo['title'] = titles[imgIndex]
            curMapInfo['coordinates'] = (x, y, x + imgSize, y + imgSize)
            mapInfos.append(curMapInfo)
            imgIndex += 1

    start = time.time()

    drawText(collage, left=int(xOffset), upper=int(imgSize * 4 + top + yShareGap), right=int(xOffset + imgSize * cols),
             lower=int(imgSize * 4 + yOffset + top + yShareGap), displayText=displayText, textSize=fontSize, format=format, logo_disp=logo_disp)

    collage = collage.convert("RGBA")
    # if format == "INTERACT":
    logo = Image.open("./public/assets/images/icon.png")
    logo = logo.convert("RGBA")
    logo = logo.resize((logo.size[0] // 6, logo.size[1] // 6))
    collage.alpha_composite(
        logo, (int(width - xOffset - logo.size[0] * 1.05), int(finalHeight - top * 2.5 - yShareGap * .95)))
    # else:
    #     icon = Image.open("./public/assets/images/icon.png")
    #     icon = icon.convert("RGBA")
    #     collage.alpha_composite(icon, (10, finalHeight - 185))
    collage = collage.convert("RGB")
    print("text time: " + str(time.time()-start))
    print("collage time: " + str(time.time()-startCollage))

    return collage, mapInfos


def downloadImg(imgLink, index: int, images: list, imgSize: int):
    image = Image.open(requests.get(
        imgLink, stream=True).raw)
    if image.size != [imgSize, imgSize]:
        image = image.resize([imgSize, imgSize])
    images[index] = image


def factorTuples(n):
    # get all factors
    factors = sorted(reduce(list.__add__,
                            ([i, n//i] for i in range(1, int(n**0.5) + 1) if n % i == 0)))
    tuples = []
    # create tuples of all factors
    for i in range(0, int(len(factors) / 2)):
        tuple = [factors[i], factors[len(factors) - 1 - i]]
        tuples.append(tuple)
    return tuples


def getDim(num, format):

    if format == "SHARE":
        if num >= 32:
            return [4, 8]
        else:
            return [4, num // 4]

    if format == "INTERACT":
        return [3, num // 3]
