from flask import Flask, request, send_file
from flask_cors import CORS
import requests
import concurrent.futures
from PIL import Image, ImageDraw, ImageFont
import io
from functools import reduce
import time
import os
import random

app = Flask(__name__)
CORS(app)


@app.route("/api/collage", methods=['POST', 'GET'])
def hello_world():
    token = ""
    if request.method == 'POST':
        data = request.get_json()
        token = data['access_token']
        length = data['length']
        type = data['type']
        format = data['format']
        name = data['name']
        date = data['date']
        collage = makeCollage(token, type, 100, 0, length, format, name, date)

        start = time.time()
        image_io = io.BytesIO()
        collage.save(image_io, format='JPEG')
        image_io.seek(0)
        print("bytesio time: " + str(time.time() - start), flush=True)

        collage.close()

        return send_file(image_io, mimetype='image/jpeg')


def makeCollage(auth_token, item_type, limit, offset, time_range, format, name, date):

    req_url = 'https://api.spotify.com/v1/me/top/' + \
        item_type + '?' + 'limit=' + \
        str(limit) + '&offset=' + str(offset) + '&time_range=' + time_range

    response = requests.get(url=req_url, headers={
        "Authorization": "Bearer " + auth_token, "Content-Type": "application/json"}).json()

    count = 1
    imgSize = 640
    albumInfos = set()
    imageLinks = []
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

        lastImg = pics[0]  # last pic is smallest pixels
        # print(item_type + str(lastImg['width']))

        # if (lastImg['width'] < imgSize):  # maintain accurate size
        #     imgSize = lastImg['width']

        if albumInfo not in albumInfos:
            albumInfos.add(albumInfo)
            imageLinks.append(lastImg['url'])

        info += '\n' + lastImg['url']

        # print(str(count) + '. ' + info)  # track info
        # print("ALBUM: " + albumInfo + "\n")

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
        timeText = "ALL-TIME"
    else:
        timeText = "LAST MONTH"

    if item_type == "artists":
        typeText = "TOP ARTISTS"
    else:
        typeText = "TOP TRACKS"
    nameSplit = name.split()
    if len(nameSplit[0]) <= 12:
        nameFinal = nameSplit[0].upper() + "'S "
    else:
        nameFinal = ""
    displayText = [nameFinal.upper(), timeText, typeText, date]

    collage = constructCollage(images, imgSize, format, displayText)

    return collage


def drawText(collage: Image, left, upper, right, lower, displayText, textSize, format):
    font = ImageFont.truetype(
        "./public/assets/fonts/ClashDisplay-Semibold.otf", textSize)

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

    toPaste = Image.composite(background, rect, text)

    collage.paste(toPaste, [left, upper])


def constructCollage(images: list, imgSize: int, format, displayText):
    startCollage = time.time()
    dimensions = getDim(len(images), format)
    # print("dimensions: " + str(dimensions))
    cols = dimensions[0]
    rows = dimensions[1]

    xOffset = yOffset = width = fontSize = 0
    height = imgSize * rows

    if format == "SHARE":
        fontSize = 95
        yOffset = 96
        if len(images) >= 32:
            factor = (height + yOffset) / 16
            width = factor * 9
            xOffset = (width - (imgSize * cols)) // 2
        else:
            width = 2880
            xOffset = 90
    elif format == "INTERACT":
        fontSize = 75
        xOffset = 60
        yOffset = 120
        width = imgSize * cols + xOffset * 2

    finalHeight = height + yOffset

    # print("img size: " + str(imgSize) + " " +
    #       str(width) + "x" + str(finalHeight))

    collage = Image.new(mode="RGB", size=(int(width), finalHeight))
    swirls = Image.open("./public/assets/images/swirls2.jpeg")

    swirls = swirls.rotate(90 * random.randint(1, 3))

    l = 0

    while l < collage.height:
        collage.paste(swirls, (0, l))
        l += swirls.height
        swirls = swirls.rotate(90)

    imgIndex = 0
    for r in range(0, rows):
        for c in range(0, cols):
            if (imgIndex >= len(images)):
                break
            x = imgSize * c + (xOffset)
            # if format == "SHARE":
            #     x += int(width / 18)
            # elif format == "INTERACT":
            #     x += xOffset / 2
            y = imgSize * r
            if r >= 4:
                y += yOffset  # gap for text
            collage.paste(images[imgIndex], (int(x), int(y)))
            imgIndex += 1

    start = time.time()

    drawText(collage, int(xOffset), int(imgSize * 4), int(width -
             xOffset), int(imgSize * 4 + yOffset), displayText, fontSize, format)
    print("text time: " + str(time.time()-start))
    print("collage time: " + str(time.time()-startCollage))

    return collage


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
    # MAX_DIFF = 4  # maintain squareness
    # smallest = [0, 0]
    # while (smallest[0] == 0):
    #     factors = factorTuples(num)
    #     smallestDiff = factors[len(factors) - 1]
    #     diff = smallestDiff[1] - smallestDiff[0]
    #     if (diff <= MAX_DIFF):
    #         smallest[0] = smallestDiff[0]
    #         smallest[1] = smallestDiff[1]
    #     num -= 1
    if format == "SHARE":
        if num >= 32:
            return [4, 8]
        else:
            return [4, num // 4]

    if format == "INTERACT":
        return [3, num // 3]


@app.route("/api/healthchecker", methods=["GET"])
def healthchecker():
    return {"status": "success", "message": os.getcwd()}
