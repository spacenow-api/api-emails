'use strict'

const crypto = require('crypto')
const moment = require('moment')

const {
  Listing,
  UserProfile,
  ListingPhotos,
  ListSettings,
  ListSettingsParent,
  ListingAccessDays,
  ListingAccessHours
} = require('./../models')

module.exports = {
  getRoundValue: function(value) {
    return Math.round(value * 100) / 100
  },

  getDefaultFeeValue: function(basePrice, guestServiceFee) {
    return this.getRoundValue(basePrice * guestServiceFee)
  },

  getTotalSpaceWithoutFee: function(basePrice, quantity = 1, period) {
    return this.getRoundValue(basePrice * quantity * period)
  },

  getHashValue: function(value) {
    return crypto
      .createHash('sha256')
      .update(value, 'utf8')
      .digest('hex')
  },

  getPeriodFormatted: function(quantity, periodType) {
    let period = ''
    switch (periodType) {
      case 'weekly':
        period = quantity > 1 ? 'Weeks' : 'Week'
        break
      case 'monthly':
        period = quantity > 1 ? 'Months' : 'Month'
        break
      case 'hourly':
        period = quantity > 1 ? 'Hours' : 'Hour'
        break
      case 'daily':
        period = quantity > 1 ? 'Days' : 'Day'
        break
      default:
        break
    }
    return `${quantity} ${period}`
  },

  getCoverPhotoPath: async function(listingId) {
    const listingPhotosArray = await ListingPhotos.findAll({
      where: { listingId }
    })
    if (listingPhotosArray && listingPhotosArray.length > 0) {
      const coverPhoto = listingPhotosArray.filter(o => o.isCover)
      if (coverPhoto && coverPhoto.length > 0) return coverPhoto[0].name
      return listingPhotosArray[0].name
    }
    return ''
  },

  getCategoryAndSubNames: async function(listSettingsParentId) {
    const parentObj = await ListSettingsParent.findOne({
      attributes: ['listSettingsParentId', 'listSettingsChildId'],
      where: { id: listSettingsParentId }
    })
    const categoryObj = await ListSettings.findOne({
      attributes: ['id', 'itemName'],
      where: { id: parentObj.listSettingsParentId }
    })
    const subCategoryObj = await ListSettings.findOne({
      attributes: ['id', 'itemName'],
      where: { id: parentObj.listSettingsChildId }
    })
    return {
      category: categoryObj.itemName,
      subCaregory: subCategoryObj.itemName
    }
  },

  getProfilePicture: async function(userId) {
    const userProfileObj = await UserProfile.findOne({ where: { userId } })
    if (userProfileObj) return userProfileObj.picture || 'https://app.spacenow.com/static/media/defaultPic.1050b195.png'
    return 'https://app.spacenow.com/static/media/defaultPic.1050b195.png'
  },

  getTimeAvailability: async function(listingId) {
    const accessDaysObj = await ListingAccessDays.findOne({
      where: { listingId },
      attributes: ['id']
    })
    const accessHours = await ListingAccessHours.findAll({
      where: { listingAccessDaysId: accessDaysObj.id }
    })
    let availability = []
    for (let i = 0; i < 7; i += 1) {
      let dayValue = ''
      const dayOf = accessHours.find(o => o.weekday == i)
      if (dayOf && dayOf.allday) {
        dayValue = '24 Hours'
      } else if (dayOf) {
        const hourOpen = moment(dayOf.openHour)
          .tz('Australia/Sydney')
          .format('hh:mm A')
          .toString()
        const hourClose = moment(dayOf.closeHour)
          .tz('Australia/Sydney')
          .format('hh:mm A')
          .toString()
        dayValue = `${hourOpen} to ${hourClose}`
      } else {
        dayValue = 'Closed'
      }
      availability[i] = dayValue
    }
    return availability
  },

  getListingById: async function(listingId) {
    return Listing.findOne({ where: { id: listingId } })
  }
}
