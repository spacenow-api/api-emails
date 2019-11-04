'use strict'

const axios = require('axios')
const moment = require('moment')

const listingCommons = require('./../helpers/listings.common')
const senderService = require('./sender')

const { User, UserProfile, Location, ListingAccessDays, ListingAccessHours, ListingData } = require('./../models')

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

async function getCheckInOutTime(listingId, date) {
  const weekDay = moment(date).day()
  const accessDay = await ListingAccessDays.findOne({
    where: { listingId: listingId }
  })
  const accessHours = await ListingAccessHours.findOne({
    where: {
      listingAccessDaysId: accessDay.id,
      weekday: `${weekDay}`
    }
  })
  return accessHours
}

function getReservations(bookingObj) {
  if (bookingObj.priceType !== 'daily') return []
  const reservations = []
  const originalReservations = bookingObj.reservations
  for (let i = 0; i < originalReservations.length; i += 1) {
    const mInstance = moment(originalReservations[i])
    const monthName = mInstance.format('MMMM')
    let reservationObj = reservations.find(o => o.month === monthName)
    if (!reservationObj) {
      reservationObj = { month: '', days: [] }
      reservations.push(reservationObj)
    }
    reservationObj.month = monthName
    reservationObj.days.push({ number: mInstance.format('D') })
  }
  return reservations
}

function getAcceptLink(bookingId, hostId) {
  return `${process.env.NEW_LISTING_PROCESS_HOST}/account/booking?b=${bookingId}&a=${listingCommons.getHashValue(
    hostId + 'APPROVE'
  )}`
}

function getDeclineLink(bookingId, hostId) {
  return `${process.env.NEW_LISTING_PROCESS_HOST}/account/booking?b=${bookingId}&a=${listingCommons.getHashValue(
    hostId + 'DECLINE'
  )}`
}

module.exports = {
  /**
   * Send email to host by a booking instant.
   */
  sendEmailInstantHost: async bookingId => {
    const { data: bookingObj } = await getBookingById(bookingId)
    const listingObj = await listingCommons.getListingById(bookingObj.listingId)
    const hostObj = await getUserById(bookingObj.hostId)
    const guestObj = await getUserById(bookingObj.guestId)
    const locationObj = await Location.findOne({
      where: { id: listingObj.locationId }
    })
    const listingData = await ListingData.findOne({
      where: { listingId: listingObj.id }
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
    const IS_ABSORVE = 0.035
    const NO_ABSORVE = 0.135
    let serviceFee = listingData.isAbsorvedFee
      ? bookingObj.basePrice * bookingObj.period * IS_ABSORVE
      : bookingObj.basePrice * bookingObj.period * NO_ABSORVE
    let checkInObj = await getCheckInOutTime(listingObj.id, bookingObj.checkIn)
    let checkInTime =
      checkInObj.allday === 1
        ? '24 hours'
        : moment(checkInObj.openHour)
            .tz('Australia/Sydney')
            .format('h:mm a')

    let checkOutObj = await getCheckInOutTime(listingObj.id, bookingObj.checkOut)
    let checkOutTime =
      checkOutObj.allday === 1
        ? '24 hours'
        : moment(checkOutObj.closeHour)
            .tz('Australia/Sydney')
            .format('h:mm a')
    const categoryAndSubObj = await listingCommons.getCategoryAndSubNames(listingObj.listSettingsParentId)
    const coverPhoto = await listingCommons.getCoverPhotoPath(listingObj.id)
    const guestProfilePicture = await listingCommons.getProfilePicture(bookingObj.guestId)
    const hostMetadata = {
      user: hostObj.firstName,
      hostName: hostObj.firstName,
      guestName: guestObj.firstName,
      checkinDateShort: checkInShort,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      listTitle: listingObj.title,
      listAddress: `${locationObj.address1}, ${locationObj.city}`,
      totalPeriod: `${listingCommons.getPeriodFormatted(bookingObj.reservations.length, bookingObj.priceType)}`,
      total: bookingObj.totalPrice.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'),
      basePrice: bookingObj.basePrice.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'),
      priceType: bookingObj.priceType,
      listImage: coverPhoto,
      category: categoryAndSubObj.category,
      subCategoryName: categoryAndSubObj.subCaregory,
      currentDate: moment()
        .tz('Australia/Sydney')
        .format('dddd, MMMM Do, YYYY')
        .toString(),
      guestPhoto: guestProfilePicture,
      checkInMonth: moment(new Date(bookingObj.checkIn))
        .tz('Australia/Sydney')
        .format('MMM')
        .toString()
        .toUpperCase(),
      checkOutMonth: moment(new Date(bookingObj.checkOut))
        .tz('Australia/Sydney')
        .format('MMM')
        .toString()
        .toUpperCase(),
      checkInDay: moment(new Date(bookingObj.checkIn))
        .tz('Australia/Sydney')
        .format('DD')
        .toString(),
      checkOutDay: moment(new Date(bookingObj.checkOut))
        .tz('Australia/Sydney')
        .format('DD')
        .toString(),
      checkInWeekday: moment(new Date(bookingObj.checkIn))
        .tz('Australia/Sydney')
        .format('ddd')
        .toString(),
      checkOutWeekday: moment(new Date(bookingObj.checkOut))
        .tz('Australia/Sydney')
        .format('ddd')
        .toString(),
      checkInTime: checkInTime,
      checkOutTime: checkOutTime,
      subtotal: (bookingObj.totalPrice - serviceFee).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'),
      serviceFee: serviceFee.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'),
      period: bookingObj.period
    }
    console.log('hostMetadata', hostMetadata)
    await senderService.senderByTemplateData('booking-instant-email-host', hostObj.email, hostMetadata)
  },

  /**
   * Send email to Guest by a booking instant.
   */
  sendEmailInstantGuest: async bookingId => {
    const { data: bookingObj } = await getBookingById(bookingId)
    const listingObj = await listingCommons.getListingById(bookingObj.listingId)
    const hostObj = await getUserById(bookingObj.hostId)
    const guestObj = await getUserById(bookingObj.guestId)
    const locationObj = await Location.findOne({
      where: { id: listingObj.locationId }
    })
    const listingData = await ListingData.findOne({
      where: { listingId: listingObj.id }
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
    let checkInObj = await getCheckInOutTime(listingObj.id, bookingObj.checkIn)
    let checkInTime =
      checkInObj.allday === 1
        ? '24 hours'
        : moment(checkInObj.openHour)
            .tz('Australia/Sydney')
            .format('h:mm a')
    const IS_ABSORVE = 0.035
    const NO_ABSORVE = 0.135
    let serviceFee = listingData.isAbsorvedFee
      ? bookingObj.basePrice * bookingObj.period * IS_ABSORVE
      : bookingObj.basePrice * bookingObj.period * NO_ABSORVE

    let checkOutObj = await getCheckInOutTime(listingObj.id, bookingObj.checkOut)
    let checkOutTime =
      checkOutObj.allday === 1
        ? '24 hours'
        : moment(checkOutObj.closeHour)
            .tz('Australia/Sydney')
            .format('h:mm a')
    const userProfilePicture = await listingCommons.getProfilePicture(bookingObj.hostId)
    const coverPhoto = await listingCommons.getCoverPhotoPath(listingObj.id)
    const categoryAndSubObj = await listingCommons.getCategoryAndSubNames(listingObj.listSettingsParentId)
    const guestMetada = {
      user: guestObj.firstName,
      hostName: hostObj.firstName,
      guestName: guestObj.firstName,
      listCity: locationObj.city,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      checkinDateShort: checkInShort,
      profilePicture: userProfilePicture,
      listTitle: listingObj.title,
      fullAddress: `${locationObj.address1}, ${locationObj.city}`,
      basePrice: bookingObj.basePrice,
      totalPeriod: `${listingCommons.getPeriodFormatted(bookingObj.reservations.length, bookingObj.priceType)}`,
      subtotal: (bookingObj.totalPrice - serviceFee).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'),
      serviceFee: serviceFee.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'),
      total: bookingObj.totalPrice.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'),
      priceType: bookingObj.priceType,
      currentDate: moment()
        .tz('Australia/Sydney')
        .format('dddd, MMMM Do, YYYY')
        .toString(),
      checkInMonth: moment(new Date(bookingObj.checkIn))
        .tz('Australia/Sydney')
        .format('MMM')
        .toString()
        .toUpperCase(),
      checkOutMonth: moment(new Date(bookingObj.checkOut))
        .tz('Australia/Sydney')
        .format('MMM')
        .toString()
        .toUpperCase(),
      checkInDay: moment(new Date(bookingObj.checkIn))
        .tz('Australia/Sydney')
        .format('DD')
        .toString(),
      checkOutDay: moment(new Date(bookingObj.checkOut))
        .tz('Australia/Sydney')
        .format('DD')
        .toString(),
      checkInWeekday: moment(new Date(bookingObj.checkIn))
        .tz('Australia/Sydney')
        .format('ddd')
        .toString(),
      checkOutWeekday: moment(new Date(bookingObj.checkOut))
        .tz('Australia/Sydney')
        .format('ddd')
        .toString(),
      checkInTime: checkInTime,
      checkOutTime: checkOutTime,
      listImage: coverPhoto,
      category: categoryAndSubObj.category
    }
    console.log('guestMetada', guestMetada)
    await senderService.senderByTemplateData('booking-instant-email-guest', guestObj.email, guestMetada)
  },

  /**
   * Send email by requested booking to host.
   */
  sendEmailRequestHost: async bookingId => {
    const { data: bookingObj } = await getBookingById(bookingId)
    const listingObj = await listingCommons.getListingById(bookingObj.listingId)
    const hostObj = await getUserById(bookingObj.hostId)
    const guestObj = await getUserById(bookingObj.guestId)
    const listingData = await ListingData.findOne({
      where: { listingId: listingObj.id }
    })
    const locationObj = await Location.findOne({
      where: { id: listingObj.locationId }
    })
    const IS_ABSORVE = 0.035
    const NO_ABSORVE = 0.135
    let serviceFee = listingData.isAbsorvedFee
      ? bookingObj.basePrice * bookingObj.period * IS_ABSORVE
      : bookingObj.basePrice * bookingObj.period * NO_ABSORVE
    const checkIn = moment(bookingObj.checkIn)
      .tz('Australia/Sydney')
      .format('ddd, Do MMM, YYYY')
      .toString()
    const checkOut = moment(bookingObj.checkOut)
      .tz('Australia/Sydney')
      .format('ddd, Do MMM, YYYY')
      .toString()
    let term = 'day'
    if (bookingObj.priceType !== 'daily') term = bookingObj.priceType.replace('ly', '')
    let checkInObj = await getCheckInOutTime(listingObj.id, bookingObj.checkIn)
    let checkInTime =
      checkInObj.allday === 1
        ? '24 hours'
        : moment(checkInObj.openHour)
            .tz('Australia/Sydney')
            .format('h:mm a')

    let checkOutObj = await getCheckInOutTime(listingObj.id, bookingObj.checkOut)
    let checkOutTime =
      checkOutObj.allday === 1
        ? '24 hours'
        : moment(checkOutObj.closeHour)
            .tz('Australia/Sydney')
            .format('h:mm a')

    const categoryAndSubObj = await listingCommons.getCategoryAndSubNames(listingObj.listSettingsParentId)
    const coverPhoto = await listingCommons.getCoverPhotoPath(listingObj.id)
    const guestProfilePicture = await listingCommons.getProfilePicture(bookingObj.guestId)

    const hostMetadata = {
      user: hostObj.firstName,
      guestName: guestObj.firstName,
      listTitle: listingObj.title,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      basePrice: bookingObj.basePrice.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'),
      total: bookingObj.totalPrice.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'),
      acceptLink: getAcceptLink(bookingObj.bookingId, hostObj.id),
      declineLink: getDeclineLink(bookingObj.bookingId, hostObj.id),
      currentDate: moment()
        .tz('Australia/Sydney')
        .format('dddd, MMMM Do, YYYY')
        .toString(),
      term: term,
      checkInMonth: moment(new Date(bookingObj.checkIn))
        .tz('Australia/Sydney')
        .format('MMM')
        .toString()
        .toUpperCase(),
      checkOutMonth: moment(new Date(bookingObj.checkOut))
        .tz('Australia/Sydney')
        .format('MMM')
        .toString()
        .toUpperCase(),
      checkInDay: moment(new Date(bookingObj.checkIn))
        .tz('Australia/Sydney')
        .format('DD')
        .toString(),
      checkOutDay: moment(new Date(bookingObj.checkOut))
        .tz('Australia/Sydney')
        .format('DD')
        .toString(),
      checkInWeekday: moment(new Date(bookingObj.checkIn))
        .tz('Australia/Sydney')
        .format('ddd')
        .toString(),
      checkOutWeekday: moment(new Date(bookingObj.checkOut))
        .tz('Australia/Sydney')
        .format('ddd')
        .toString(),
      checkInTime: checkInTime,
      checkOutTime: checkOutTime,
      subtotal: (bookingObj.totalPrice - serviceFee).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'),
      serviceFee: serviceFee.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'),
      listAddress: `${locationObj.address1}, ${locationObj.city}`,
      priceType: bookingObj.priceType,
      category: categoryAndSubObj.category,
      listImage: coverPhoto,
      guestPhoto: guestProfilePicture,
      period: bookingObj.period
    }

    await senderService.senderByTemplateData('booking-request-email-host', hostObj.email, hostMetadata)
  },

  /**
   * Send email by requested booking to guest.
   */
  sendEmailRequestGuest: async bookingId => {
    const { data: bookingObj } = await getBookingById(bookingId)
    const listingObj = await listingCommons.getListingById(bookingObj.listingId)
    const hostObj = await getUserById(bookingObj.hostId)
    const guestObj = await getUserById(bookingObj.guestId)
    const listingData = await ListingData.findOne({
      where: { listingId: listingObj.id }
    })
    const locationObj = await Location.findOne({
      where: { id: listingObj.locationId }
    })
    const IS_ABSORVE = 0.035
    const NO_ABSORVE = 0.135
    let serviceFee = listingData.isAbsorvedFee
      ? bookingObj.basePrice * bookingObj.period * IS_ABSORVE
      : bookingObj.basePrice * bookingObj.period * NO_ABSORVE
    const checkIn = moment(bookingObj.checkIn)
      .tz('Australia/Sydney')
      .format('ddd, Do MMM, YYYY')
      .toString()
    const checkOut = moment(bookingObj.checkOut)
      .tz('Australia/Sydney')
      .format('ddd, Do MMM, YYYY')
      .toString()

    let term = 'day'
    if (bookingObj.priceType !== 'daily') term = bookingObj.priceType.replace('ly', '')
    let checkInObj = await getCheckInOutTime(listingObj.id, bookingObj.checkIn)
    let checkInTime =
      checkInObj.allday === 1
        ? '24 hours'
        : moment(checkInObj.openHour)
            .tz('Australia/Sydney')
            .format('h:mm a')

    let checkOutObj = await getCheckInOutTime(listingObj.id, bookingObj.checkOut)
    let checkOutTime =
      checkOutObj.allday === 1
        ? '24 hours'
        : moment(checkOutObj.closeHour)
            .tz('Australia/Sydney')
            .format('h:mm a')
    const hostProfilePicture = await listingCommons.getProfilePicture(bookingObj.hostId)
    const coverPhoto = await listingCommons.getCoverPhotoPath(listingObj.id)
    const categoryAndSubObj = await listingCommons.getCategoryAndSubNames(listingObj.listSettingsParentId)

    const guestMetadata = {
      guestName: guestObj.firstName,
      confirmationCode: bookingObj.confirmationCode,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      hostName: hostObj.firstName,
      listTitle: listingObj.title,
      currentDate: moment()
        .tz('Australia/Sydney')
        .format('dddd, MMMM Do, YYYY')
        .toString(),
      hostPhoto: hostProfilePicture,
      hostName: hostObj.displayName,
      checkInMonth: moment(new Date(bookingObj.checkIn))
        .tz('Australia/Sydney')
        .format('MMM')
        .toString()
        .toUpperCase(),
      checkOutMonth: moment(new Date(bookingObj.checkOut))
        .tz('Australia/Sydney')
        .format('MMM')
        .toString()
        .toUpperCase(),
      checkInDay: moment(new Date(bookingObj.checkIn))
        .tz('Australia/Sydney')
        .format('DD')
        .toString(),
      checkOutDay: moment(new Date(bookingObj.checkOut))
        .tz('Australia/Sydney')
        .format('DD')
        .toString(),
      checkInWeekday: moment(new Date(bookingObj.checkIn))
        .tz('Australia/Sydney')
        .format('ddd')
        .toString(),
      checkOutWeekday: moment(new Date(bookingObj.checkOut))
        .tz('Australia/Sydney')
        .format('ddd')
        .toString(),
      checkInTime: checkInTime,
      checkOutTime: checkOutTime,
      period: bookingObj.period,
      term: term,
      subtotal: (bookingObj.totalPrice - serviceFee).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'),
      serviceFee: serviceFee.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'),
      basePrice: bookingObj.basePrice.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'),
      total: bookingObj.totalPrice.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'),
      priceType: bookingObj.priceType,
      listAddress: `${locationObj.address1}, ${locationObj.city}`,
      listingId: listingObj.id,
      listImage: coverPhoto,
      category: categoryAndSubObj.category
    }
    await senderService.senderByTemplateData('booking-request-email-guest', guestObj.email, guestMetadata)
  },

  /**
   * Send email to a guest who has a booking declined.
   */
  sendEmailDeclined: async bookingId => {
    const { data: bookingObj } = await getBookingById(bookingId)
    const hostObj = await getUserById(bookingObj.hostId)
    const guestObj = await getUserById(bookingObj.guestId)
    const listingObj = await listingCommons.getListingById(bookingObj.listingId)
    const checkIn = moment(bookingObj.checkIn)
      .tz('Australia/Sydney')
      .format('ddd, Do MMM, YYYY')
      .toString()
    const checkOut = moment(bookingObj.checkOut)
      .tz('Australia/Sydney')
      .format('ddd, Do MMM, YYYY')
      .toString()
    const declinedMetadata = {
      guestName: guestObj.firstName,
      hostName: hostObj.firstName,
      confirmationCode: bookingObj.confirmationCode,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      appLink: process.env.NEW_LISTING_PROCESS_HOST,
      currentDate: moment()
        .tz('Australia/Sydney')
        .format('dddd, MMMM Do, YYYY')
        .toString(),
      listTitle: listingObj.title
    }
    await senderService.senderByTemplateData('booking-declined-email', guestObj.email, declinedMetadata)
  },

  /**
   * Send an email when bookings has finished.
   */
  sendEmailCheckOut: async bookingId => {
    const { data: bookingObj } = await getBookingById(bookingId)
    const hostObj = await getUserById(bookingObj.hostId)
    const guestObj = await getUserById(bookingObj.guestId)
    const reviewPageLink = `${process.env.NEW_LISTING_PROCESS_HOST}/review/${bookingId}`
    await senderService.senderByTemplateData('booking-request-review-guest', guestObj.email, {
      name: hostObj.firstName,
      link: `${reviewPageLink}/guest`
    })
    await senderService.senderByTemplateData('booking-request-review-host', hostObj.email, {
      name: guestObj.firstName,
      link: `${reviewPageLink}/host`
    })
  }
}
