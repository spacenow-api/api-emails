'use strict'

const axios = require('axios')

module.exports = {
  getBookingById: async (id) => {
    return axios.get(`${process.env.API_BOOKING}/${id}`)
  }
}
