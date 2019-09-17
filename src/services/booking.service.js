'use strict'

const axios = require('axios')
const moment = require('moment')

const listingCommons = require('./../helpers/listings.common')
const senderService = require('./sender')

const { User, UserProfile, Location } = require('./../models')

async function getBookingById(id) {
  return axios.get(`${process.env.API_BOOKING}/${id}`)
}

async function getUserById(userId) {
  const userData = await User.findOne({
    where: { id: userId },
    raw: true
  })
  const profileData = await UserProfile.findOne({
    where: { userId },
    raw: true
  })
  return {
    ...userData,
    ...profileData
  }
}

async function getReservations(bookingObj) {
  if (bookingObj.priceType !== 'daily') return []
  const reservations = []
  const originalReservations = bookingObj.reservations
  for (let i = 0; i < originalReservations.length; i += 1) {
    const mInstance = moment(originalReservations[i])
    const monthName = mInstance.format('MMMM')
    let reservationObj = reservations.find((o) => o.month === monthName)
    if (!reservationObj) {
      reservationObj = { month: '', days: [] }
      reservations.push(reservationObj)
    }
    reservationObj.month = monthName
    reservationObj.days.push({ number: mInstance.format('D') })
  }
  return reservations
}

module.exports = {
  /**
   * Send email to host by a booking instant.
   */
  sendEmailInstantHost: async (bookingId) => {
    const { data: bookingObj } = await getBookingById(bookingId)
    const listingObj = await listingCommons.getListingById(bookingObj.listingId)
    const hostObj = await getUserById(bookingObj.hostId)
    const guestObj = await getUserById(bookingObj.guestId)
    const locationObj = await Location.findOne({
      where: { id: listingObj.locationId }
    })
    const checkIn = moment(bookingObj.checkIn)
      .tz('Australia/Sydney')
      .format('ddd, Do MMM, YYYY')
      .toString()
    const checkOut = moment(bookingObj.checkOut)
      .tz('Australia/Sydney')
      .format('ddd, Do MMM, YYYY')
      .toString()
    const checkInShort = moment(bookingObj.checkIn)
      .tz('Australia/Sydney')
      .format('Do MMM')
      .toString()
    const categoryAndSubObj = await listingCommons.getCategoryAndSubNames(
      listingObj.listSettingsParentId
    )
    const coverPhoto = await listingCommons.getCoverPhotoPath(listingObj.id)
    const userProfilePicture = await listingCommons.getProfilePicture(
      bookingObj.hostId
    )
    const timeAvailability = await listingCommons.getTimeAvailability(
      listingObj.id
    )
    const hostMetadata = {
      user: hostObj.firstName,
      hostName: hostObj.firstName,
      guestName: guestObj.firstName,
      checkinDateShort: checkInShort,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      listTitle: listingObj.title,
      listAddress: `${locationObj.address1}, ${locationObj.city}`,
      totalPeriod: `${listingCommons.getPeriodFormatted(
        bookingObj.reservations.length,
        bookingObj.priceType
      )}`,
      basePrice: bookingObj.basePrice,
      priceType: bookingObj.priceType,
      coverPhoto: coverPhoto,
      categoryName: categoryAndSubObj.category,
      subCategoryName: categoryAndSubObj.subCaregory
    }
    await senderService.senderByTemplateData(
      'booking-instant-email-host',
      hostObj.email,
      hostMetadata
    )
  },

  /**
   * Send email to Guest by a booking instant.
   */
  sendEmailInstantGuest: async (bookingId) => {
    const { data: bookingObj } = await getBookingById(bookingId)
    const listingObj = await listingCommons.getListingById(bookingObj.listingId)
    const hostObj = await getUserById(bookingObj.hostId)
    const guestObj = await getUserById(bookingObj.guestId)
    const locationObj = await Location.findOne({
      where: { id: listingObj.locationId }
    })
    const checkIn = moment(bookingObj.checkIn)
      .tz('Australia/Sydney')
      .format('ddd, Do MMM, YYYY')
      .toString()
    const checkOut = moment(bookingObj.checkOut)
      .tz('Australia/Sydney')
      .format('ddd, Do MMM, YYYY')
      .toString()
    const checkInShort = moment(bookingObj.checkIn)
      .tz('Australia/Sydney')
      .format('Do MMM')
      .toString()
    const categoryAndSubObj = await listingCommons.getCategoryAndSubNames(
      listingObj.listSettingsParentId
    )
    const coverPhoto = await listingCommons.getCoverPhotoPath(listingObj.id)
    const userProfilePicture = await listingCommons.getProfilePicture(
      bookingObj.hostId
    )
    const timeAvailability = await listingCommons.getTimeAvailability(
      listingObj.id
    )
    const guestMetada = {
      user: guestObj.firstName,
      hostName: hostObj.firstName,
      guestName: guestObj.firstName,
      city: locationObj.city,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      checkinDateShort: checkInShort,
      profilePicture: userProfilePicture,
      shortAddress: `${locationObj.city}, ${locationObj.country}`,
      listTitle: listingObj.title,
      fullAddress: `${locationObj.address1}, ${locationObj.city}`,
      basePrice: bookingObj.basePrice,
      totalSpace: listingCommons.getTotalSpaceWithoutFee(
        bookingObj.basePrice,
        bookingObj.quantity,
        bookingObj.period
      ),
      serviceFee: listingCommons.getDefaultFeeValue(
        bookingObj.basePrice,
        bookingObj.guestServiceFee
      ),
      totalPrice: listingCommons.getRoundValue(bookingObj.totalPrice),
      isDaily: bookingObj.priceType === 'daily',
      reservations: getReservations(bookingObj),
      timeTable: timeAvailability
    }
    await senderService.senderByTemplateData(
      'booking-instant-email-guest',
      guestObj.email,
      guestMetada
    )
  }
}
