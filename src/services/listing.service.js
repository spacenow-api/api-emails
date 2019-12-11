'use strict'

const axios = require('axios')
const moment = require('moment')
const Sequelize = require('sequelize')
const Op = Sequelize.Op

const listingCommons = require('./../helpers/listings.common')
const senderService = require('./sender')

const { ListingData, Listing, User, UserProfile, Location } = require('./../models')

module.exports = {
  /**
   * Send an email to ask user to complete listing.
   */
  sendEmailCompleteListing: async () => {
    try {
      let emailObj
      let currentDate = moment()
        .tz('Australia/Sydney')
        .format('dddd D MMMM, YYYY')
        .toString()
      const pastDay = moment()
        .subtract(24, 'hours')
        .utc()
      const date = moment().utc()

      const listings = await Listing.findAll({
        where: {
          isPublished: false,
          isReady: true,
          createdAt: { [Op.between]: [pastDay, date] }
        }
      })
      for (const listing of listings) {
        const listingData = await ListingData.findOne({
          where: { listingId: listing.id }
        })
        const user = await User.findOne({
          where: { id: listing.userId }
        })
        const userProfile = await UserProfile.findOne({
          where: { userId: user.id }
        })
        const location = await Location.findOne({
          where: { id: listing.locationId }
        })
        const coverPhoto = await listingCommons.getCoverPhotoPath(listing.id)
        const categoryAndSubObj = await listingCommons.getCategoryAndSubNames(listing.listSettingsParentId)
        emailObj = {
          currentDate,
          appLink: process.env.NEW_LISTING_PROCESS_HOST,
          hostName: userProfile.firstName,
          listTitle: listing.title,
          listingId: listing.id,
          listImage: coverPhoto,
          listAddress: `${location.address1}, ${location.city}`,
          basePrice: listingData.basePrice.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'),
          priceType: listing.bookingPeriod,
          category: categoryAndSubObj.category
        }
        await senderService.senderByTemplateData('complete-listing-email', user.email, emailObj)
      }
      return listings
    } catch (err) {
      console.error(err)
      return err
    }
  }
}
