'use strict'

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
        .subtract(48, 'hours')
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
        let minimumTerm = listingData.minTerm ? listingData.minTerm : 1
        let term = 'day'
        if (listing.bookingPeriod !== 'daily') term = listing.bookingPeriod.replace('ly', '')
        if (minimumTerm > 1) term = term + 's'
        emailObj = {
          currentDate,
          appLink: process.env.NEW_LISTING_PROCESS_HOST,
          hostName: userProfile.firstName,
          hostPhoto: userProfile.picture,
          listingTitle: listing.title,
          listingId: listing.id,
          listingImage: coverPhoto,
          listingAddress: `${location.address1}, ${location.city}`,
          basePrice: listingData.basePrice.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'),
          priceType: listing.bookingPeriod,
          category: categoryAndSubObj.category,
          capacity: listingData.capacity ? listingData.capacity : 1,
          minimumTerm,
          term
        }
        console.log('emailObj', emailObj)
        await senderService.senderByTemplateData('complete-listing-email', user.email, emailObj)
      }
      return listings
    } catch (err) {
      console.error(err)
      return err
    }
  },

  /**
   * Send an email to when space is published.
   */
  sendEmailPublishListing: async id => {
    try {
      let emailObj
      let currentDate = moment()
        .tz('Australia/Sydney')
        .format('dddd D MMMM, YYYY')
        .toString()
      const listing = await Listing.findOne({
        where: {
          id
        }
      })
      const listingData = await ListingData.findOne({
        where: { listingId: id }
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
      const coverPhoto = await listingCommons.getCoverPhotoPath(id)
      const categoryAndSubObj = await listingCommons.getCategoryAndSubNames(listing.listSettingsParentId)
      let minimumTerm = listingData.minTerm ? listingData.minTerm : 1
      let term = 'day'
      if (listing.bookingPeriod !== 'daily') term = listing.bookingPeriod.replace('ly', '')
      if (minimumTerm > 1) term = term + 's'
      emailObj = {
        currentDate,
        appLink: process.env.NEW_LISTING_PROCESS_HOST,
        hostName: userProfile.firstName,
        hostPhoto: userProfile.picture,
        listTitle: listing.title,
        listingId: listing.id,
        listImage: coverPhoto,
        listAddress: `${location.address1}, ${location.city}`,
        basePrice: listingData.basePrice.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'),
        priceType: listing.bookingPeriod,
        category: categoryAndSubObj.category,
        capacity: listingData.capacity ? listingData.capacity : 1,
        minimumTerm,
        term
      }
      await senderService.senderByTemplateData('publish-listing-confirmation', user.email, emailObj)

      return listings
    } catch (err) {
      console.error(err)
      return err
    }
  }
}
