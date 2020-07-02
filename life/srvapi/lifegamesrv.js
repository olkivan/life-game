const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const MongoClient = require('mongodb').MongoClient


const PORT = 3000

const MONGO_URL = 'mongodb://localhost'
const DB_NAME = 'LifeGameDB'

const METAINFO_COLLECTION = 'GameInfo'
const FRAMEDATA_COLLECTION = 'FrameData'


let dbClient = null
let dbAPI = null

const app = express()
app.use(cors())
app.use(bodyParser())

app.use(function (err, req, res, next) {
  if (err) {
    console.log(err);
    res.status(500).send('Internal Server Error')
  }
})

app.disable('x-powered-by') // Disable redundant header


app.get('/gamelist', async (_, res) => {
  const metaInfoColl = await dbAPI.collection(METAINFO_COLLECTION)
  const metaInfo = await metaInfoColl.find().toArray()

  res.status(200).send(metaInfo)
})


app.put('/game', async (req, res) => {
  const gameId = req.body._id

  const frameData = { frameData: req.body.frames }

  delete req.body.frames

  const metaData = req.body

  const session = dbClient.startSession()

  const transactionOptions = {
    readPreference: 'primary',
    readConcern: { level: 'local' },
    writeConcern: { w: 'majority' }
  };

  try {
    await session.withTransaction(async () => {
      await upsertDocument(METAINFO_COLLECTION, gameId, metaData)
      await upsertDocument(FRAMEDATA_COLLECTION, gameId, frameData)
    }, transactionOptions)

    res.status(200).send({ accepted: true })
  } catch (e) {
    console.log(e);
    res.sendStatus(500)
  } finally {
    await session.endSession()
  }
})


app.get('/game/:gameId', async (req, res) => {
  try {
    const filter = { _id: req.params.gameId }

    const metaInfoColl = await dbAPI.collection(METAINFO_COLLECTION)
    const metaInfo = await metaInfoColl.find(filter).toArray()
    if (!metaInfo || metaInfo.length === 0) throw new Error('wrong metaInfo id')

    const frameDataColl = await dbAPI.collection(FRAMEDATA_COLLECTION)
    const frameData = await frameDataColl.find(filter).toArray()
    if (!frameData || frameData.length === 0) throw new Error('wrong frameData id')

    const gameObj = {
      ...metaInfo[0],
      frames: frameData[0].frameData
    }

    res.status(200).send(gameObj)
  } catch (e) {
    console.log(e);
    res.status(404).send({ error: 'Resource not found' })
  }
})


async function upsertDocument(collectionName, id, document) {
  if (!dbAPI) throw new Error('mongo db is not initialized')

  const collection = await dbAPI.collection(collectionName)

  const _ = await collection.updateOne(
    { _id: id },
    { $set: document },
    { upsert: true }
  )
}


async function initMongo() {
  dbClient = await MongoClient.connect(MONGO_URL)
  dbAPI = await dbClient.db(DB_NAME)
  console.log('Mongo is connected.')
}

initMongo().then(() => {
  app.listen(PORT, () => console.log(`Life game is listening on port ${PORT}!`))
})
