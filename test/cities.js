/* eslint handle-callback-err: "off"*/
process.env.NODE_ENV = 'test'

const chai = require('chai')
const chaiHttp = require('chai-http')
const server = require('../server')
const faker = require('faker')
const City = require('../app/models/city')

const loginDetails = {
  email: 'admin@admin.com',
  password: '12345'
}
let token = ''
const createdID = []
const name = faker.random.words()

chai.use(chaiHttp)

describe('*********** CITIES ***********', () => {

  describe('/POST login', () => {
    it('it should GET token', done => {
      chai
        .request(server)
        .post('/login')
        .send(loginDetails)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.property('token')
          token = res.body.token
          done()
        })
    })
  })

  describe('/GET cities', () => {
    it('it should NOT be able to consume the route since no token was sent', done => {
      chai
        .request(server)
        .get('/cities')
        .end((err, res) => {
          res.should.have.status(401)
          done()
        })
    })
    it('it should Get all the cities', done => {
      chai
        .request(server)
        .get('/cities')
        .set('Authorization', `Bearer ${token}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('object')
          res.body.docs.should.be.a('array')
          done()
        })
    })
  })

  describe('/POST city', () => {
    it('it should NOT POST a city without a name', done => {
      chai
        .request(server)
        .post('/cities')
        .set('Authorization', `Bearer ${token}`)
        .end((err, res) => {
          res.should.have.status(422)
          res.body.should.be.an('object')
          res.body.should.have.property('errors')
          done()
        })
    })
    it('it should POST a city', done => {
      const city = {
        name
      }
      chai
        .request(server)
        .post('/cities')
        .set('Authorization', `Bearer ${token}`)
        .send(city)
        .end((err, res) => {
          res.should.have.status(201)
          res.body.should.be.an('object')
          res.body.should.include.keys('_id', 'name')
          createdID.push(res.body._id)
          done()
        })
    })
    it('it should NOT POST a city that already exists', done => {
      const city = {
        name
      }
      chai
        .request(server)
        .post('/cities')
        .set('Authorization', `Bearer ${token}`)
        .send(city)
        .end((err, res) => {
          res.should.have.status(422)
          res.body.should.be.an('object')
          res.body.should.have.property('errors')
          done()
        })
    })
  })

  describe('/GET/:id city', () => {
    it('it should GET a city by the given id', done => {
      const id = createdID.slice(-1).pop()
      chai
        .request(server)
        .get(`/cities/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.an('object')
          res.body.should.have.property('name')
          res.body.should.have.property('_id').eql(id)
          done()
        })
    })
  })
})

after(() => {
  createdID.map(item => {
    City.deleteOne(
      {
        _id: item
      },
      error => {
        if (error !== null) {
          console.log(error)
        }
      }
    )
  })
})
