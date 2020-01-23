'use strict'

const axios = require('axios')
const moment = require('moment')

const listingCommons = require('./../helpers/listings.common')
const senderService = require('./sender')

const {
  User,
  UserProfile,
  Location,
  ListingAccessDays,
  ListingAccessHours,
  ListingData
  // Message
} = require('./../models')

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
    const HOST_FEE = 0.11
    const GUEST_FEE = 0.035

    let checkInObj = await getCheckInOutTime(listingObj.id, bookingObj.checkIn)
    let checkInTime =
      bookingObj.priceType === 'hourly'
        ? bookingObj.checkInHour
        : checkInObj
        ? checkInObj.allday === 1
          ? '24 hours'
          : moment(checkInObj.openHour)
              .tz('Australia/Sydney')
              .format('h:mm a')
        : 'Closed'

    let checkOutObj = await getCheckInOutTime(listingObj.id, bookingObj.checkOut)
    let checkOutTime =
      bookingObj.priceType === 'hourly'
        ? bookingObj.checkOutHour
        : checkOutObj
        ? checkOutObj.allday === 1
          ? '24 hours'
          : moment(checkOutObj.closeHour)
              .tz('Australia/Sydney')
              .format('h:mm a')
        : 'Closed'

    const categoryAndSubObj = await listingCommons.getCategoryAndSubNames(listingObj.listSettingsParentId)
    const coverPhoto = await listingCommons.getCoverPhotoPath(listingObj.id)
    const guestProfilePicture = await listingCommons.getProfilePicture(bookingObj.guestId)
    const quantity = bookingObj.period

    let serviceFeeNoDiscountGuest = bookingObj.basePrice * bookingObj.period * GUEST_FEE

    let totalBookingNoDiscountGuest = bookingObj.basePrice * bookingObj.period + serviceFeeNoDiscountGuest
    let discountValue = 0
    if (bookingObj.voucherCode) {
      discountValue = totalBookingNoDiscountGuest - bookingObj.totalPrice
    }

    let serviceFee = (bookingObj.basePrice * bookingObj.period - discountValue) * HOST_FEE
    let minimumTerm = listingData.minTerm ? listingData.minTerm : 1
    let term = 'day'
    if (listingObj.bookingPeriod !== 'daily') term = listingObj.bookingPeriod.replace('ly', '')
    if (minimumTerm > 1) term = term + 's'

    const totalPeriod = await listingCommons.getPeriodFormatted(quantity, bookingObj.priceType)
    const hostMetadata = {
      user: hostObj.firstName,
      hostName: hostObj.firstName,
      guestName: guestObj.firstName,
      hostPhoto: hostObj.picture,
      checkinDateShort: checkInShort,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      listTitle: listingObj.title,
      listAddress: `${locationObj.address1}, ${locationObj.city}`,
      totalPeriod: totalPeriod,
      total: (bookingObj.basePrice * bookingObj.period - discountValue - serviceFee)
        .toFixed(2)
        .replace(/\d(?=(\d{3})+\.)/g, '$&,'),
      basePrice: bookingObj.basePrice.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'),
      priceType: bookingObj.priceType,
      listImage: coverPhoto,
      category: categoryAndSubObj.category,
      subCategoryName: categoryAndSubObj.subCaregory,
      currentDate: moment()
        .tz('Australia/Sydney')
        .format('dddd D MMMM, YYYY')
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
      subtotal: (bookingObj.basePrice * bookingObj.period).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'),
      serviceFee: serviceFee.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'),
      period: bookingObj.period,
      appLink: process.env.NEW_LISTING_PROCESS_HOST,
      listingId: listingObj.id,
      discountValue: discountValue > 0 ? discountValue.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,') : null,
      capacity: listingData.personCapacity ? listingData.personCapacity : 1,
      minimumTerm,
      term
    }
    await senderService.senderByTemplateData('booking-instant-email-host', hostObj.email, hostMetadata)
    const smsMessage = {
      message: 'You have a new booking on Spacenow',
      sender: 'Spacenow',
      receiver: hostObj.phoneNumber
    }
    console.log('SMS Message ===>>>', smsMessage)
    await axios.post(`${process.env.NOTIFICATION_API}/send-sms-message`, JSON.stringify(smsMessage))
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
      bookingObj.priceType === 'hourly'
        ? bookingObj.checkInHour
        : checkInObj
        ? checkInObj.allday === 1
          ? '24 hours'
          : moment(checkInObj.openHour)
              .tz('Australia/Sydney')
              .format('h:mm a')
        : 'Closed'

    let checkOutObj = await getCheckInOutTime(listingObj.id, bookingObj.checkOut)
    let checkOutTime =
      bookingObj.priceType === 'hourly'
        ? bookingObj.checkOutHour
        : checkOutObj
        ? checkOutObj.allday === 1
          ? '24 hours'
          : moment(checkOutObj.closeHour)
              .tz('Australia/Sydney')
              .format('h:mm a')
        : 'Closed'
    const GUEST_FEE = 0.035
    // const NO_ABSORVE = 0.135
    // let serviceFee = listingData.isAbsorvedFee
    //   ? bookingObj.basePrice * bookingObj.period * IS_ABSORVE
    //   : bookingObj.basePrice * bookingObj.period * NO_ABSORVE
    const userProfilePicture = await listingCommons.getProfilePicture(bookingObj.hostId)
    const coverPhoto = await listingCommons.getCoverPhotoPath(listingObj.id)
    const categoryAndSubObj = await listingCommons.getCategoryAndSubNames(listingObj.listSettingsParentId)
    const quantity = bookingObj.period
    const totalPeriod = await listingCommons.getPeriodFormatted(quantity, bookingObj.priceType)

    let serviceFee = bookingObj.basePrice * bookingObj.period * GUEST_FEE
    let totalBookingNoDiscountGuest = bookingObj.basePrice * bookingObj.period + serviceFee
    let discountValue = 0
    if (bookingObj.voucherCode) {
      discountValue = totalBookingNoDiscountGuest - bookingObj.totalPrice
    }

    let minimumTerm = listingData.minTerm ? listingData.minTerm : 1
    let term = 'day'
    if (listingObj.bookingPeriod !== 'daily') term = listingObj.bookingPeriod.replace('ly', '')
    if (minimumTerm > 1) term = term + 's'

    const guestMetada = {
      user: guestObj.firstName,
      hostName: hostObj.firstName,
      guestName: guestObj.firstName,
      hostPhoto: hostObj.picture,
      listCity: locationObj.city,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      checkinDateShort: checkInShort,
      profilePicture: userProfilePicture,
      listTitle: listingObj.title,
      fullAddress: `${locationObj.address1}, ${locationObj.city}`,
      basePrice: bookingObj.basePrice.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'),
      totalPeriod: totalPeriod,
      subtotal: (bookingObj.basePrice * bookingObj.period).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'),
      serviceFee: serviceFee.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'),
      total: bookingObj.totalPrice.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'),
      priceType: bookingObj.priceType,
      currentDate: moment()
        .tz('Australia/Sydney')
        .format('dddd D MMMM, YYYY')
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
      category: categoryAndSubObj.category,
      appLink: process.env.NEW_LISTING_PROCESS_HOST,
      listingId: listingObj.id,
      valueDiscount: discountValue > 0 ? discountValue.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,') : null,
      capacity: listingData.personCapacity ? listingData.personCapacity : 1,
      minimumTerm,
      term
    }
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
    // const IS_ABSORVE = 0.11
    // const NO_ABSORVE = 0.0
    // let serviceFee = listingData.isAbsorvedFee
    //   ? bookingObj.basePrice * bookingObj.period * IS_ABSORVE
    //   : bookingObj.basePrice * bookingObj.period * NO_ABSORVE
    const checkIn = moment(bookingObj.checkIn)
      .tz('Australia/Sydney')
      .format('ddd, Do MMM, YYYY')
      .toString()
    const checkOut = moment(bookingObj.checkOut)
      .tz('Australia/Sydney')
      .format('ddd, Do MMM, YYYY')
      .toString()
    let checkInObj = await getCheckInOutTime(listingObj.id, bookingObj.checkIn)
    let checkInTime =
      bookingObj.priceType === 'hourly'
        ? bookingObj.checkInHour
        : checkInObj
        ? checkInObj.allday === 1
          ? '24 hours'
          : moment(checkInObj.openHour)
              .tz('Australia/Sydney')
              .format('h:mm a')
        : 'Closed'

    let checkOutObj = await getCheckInOutTime(listingObj.id, bookingObj.checkOut)
    let checkOutTime =
      bookingObj.priceType === 'hourly'
        ? bookingObj.checkOutHour
        : checkOutObj
        ? checkOutObj.allday === 1
          ? '24 hours'
          : moment(checkOutObj.closeHour)
              .tz('Australia/Sydney')
              .format('h:mm a')
        : 'Closed'

    const categoryAndSubObj = await listingCommons.getCategoryAndSubNames(listingObj.listSettingsParentId)
    const coverPhoto = await listingCommons.getCoverPhotoPath(listingObj.id)
    const guestProfilePicture = await listingCommons.getProfilePicture(bookingObj.guestId)
    const quantity = bookingObj.period
    const totalPeriod = await listingCommons.getPeriodFormatted(quantity, bookingObj.priceType)

    const HOST_FEE = 0.11
    const GUEST_FEE = 0.035
    let serviceFeeNoDiscountGuest = bookingObj.basePrice * bookingObj.period * GUEST_FEE

    let totalBookingNoDiscountGuest = bookingObj.basePrice * bookingObj.period + serviceFeeNoDiscountGuest
    let discountValue = 0
    if (bookingObj.voucherCode) {
      discountValue = totalBookingNoDiscountGuest - bookingObj.totalPrice
    }

    let serviceFee = (bookingObj.basePrice * bookingObj.period - discountValue) * HOST_FEE
    let minimumTerm = listingData.minTerm ? listingData.minTerm : 1
    let term = 'day'
    if (listingObj.bookingPeriod !== 'daily') term = listingObj.bookingPeriod.replace('ly', '')
    if (minimumTerm > 1) term = term + 's'

    const hostMetadata = {
      user: hostObj.firstName,
      hostPhoto: hostObj.picture,
      guestName: guestObj.firstName,
      listTitle: listingObj.title,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      basePrice: bookingObj.basePrice.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'),
      total: (bookingObj.basePrice * bookingObj.period - discountValue - serviceFee)
        .toFixed(2)
        .replace(/\d(?=(\d{3})+\.)/g, '$&,'),
      acceptLink: getAcceptLink(bookingObj.bookingId, hostObj.id),
      declineLink: getDeclineLink(bookingObj.bookingId, hostObj.id),
      currentDate: moment()
        .tz('Australia/Sydney')
        .format('dddd D MMMM, YYYY')
        .toString(),
      termSingular: term.replace('s', ''),
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
      subtotal: (bookingObj.basePrice * bookingObj.period).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'),
      serviceFee: serviceFee.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'),
      listAddress: `${locationObj.address1}, ${locationObj.city}`,
      priceType: bookingObj.priceType,
      category: categoryAndSubObj.category,
      listImage: coverPhoto,
      guestPhoto: guestProfilePicture,
      period: bookingObj.period,
      totalPeriod: totalPeriod,
      listingId: listingObj.id,
      appLink: process.env.NEW_LISTING_PROCESS_HOST,
      message: bookingObj.message,
      valueDiscount: discountValue > 0 ? discountValue.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,') : null,
      capacity: listingData.personCapacity ? listingData.personCapacity : 1,
      term,
      minimumTerm
    }

    console.log('HOST META DATA ==>>', hostMetadata)

    await senderService.senderByTemplateData('booking-request-email-host', hostObj.email, hostMetadata)
    const smsMessage = {
      message: 'You have a new request booking on Spacenow',
      sender: 'Spacenow',
      receiver: hostObj.phoneNumber
    }
    console.log('SMS Message ===>>>', smsMessage)
    await axios.post(`${process.env.NOTIFICATION_API}/send-sms-message`, JSON.stringify(smsMessage))
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
    // const IS_ABSORVE = 0.035
    // const NO_ABSORVE = 0.135
    // let serviceFee = listingData.isAbsorvedFee
    //   ? bookingObj.basePrice * bookingObj.period * IS_ABSORVE
    //   : bookingObj.basePrice * bookingObj.period * NO_ABSORVE
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
    let minimumTerm = listingData.minTerm ? listingData.minTerm : 1
    if (minimumTerm > 1) term = term + 's'
    let checkInObj = await getCheckInOutTime(listingObj.id, bookingObj.checkIn)
    let checkInTime =
      bookingObj.priceType === 'hourly'
        ? bookingObj.checkInHour
        : checkInObj
        ? checkInObj.allday === 1
          ? '24 hours'
          : moment(checkInObj.openHour)
              .tz('Australia/Sydney')
              .format('h:mm a')
        : 'Closed'

    let checkOutObj = await getCheckInOutTime(listingObj.id, bookingObj.checkOut)
    let checkOutTime =
      bookingObj.priceType === 'hourly'
        ? bookingObj.checkOutHour
        : checkOutObj
        ? checkOutObj.allday === 1
          ? '24 hours'
          : moment(checkOutObj.closeHour)
              .tz('Australia/Sydney')
              .format('h:mm a')
        : 'Closed'
    const hostProfilePicture = await listingCommons.getProfilePicture(bookingObj.hostId)
    const coverPhoto = await listingCommons.getCoverPhotoPath(listingObj.id)
    const categoryAndSubObj = await listingCommons.getCategoryAndSubNames(listingObj.listSettingsParentId)
    const quantity = bookingObj.period
    const totalPeriod = await listingCommons.getPeriodFormatted(quantity, bookingObj.priceType)

    const GUEST_FEE = 0.035
    let serviceFee = bookingObj.basePrice * bookingObj.period * GUEST_FEE
    let totalBookingNoDiscountGuest = bookingObj.basePrice * bookingObj.period + serviceFee
    let discountValue = 0
    if (bookingObj.voucherCode) {
      discountValue = totalBookingNoDiscountGuest - bookingObj.totalPrice
    }

    const guestMetadata = {
      guestName: guestObj.firstName,
      confirmationCode: bookingObj.confirmationCode,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      hostName: hostObj.firstName,
      hostPhoto: hostObj.picture,
      listTitle: listingObj.title,
      currentDate: moment()
        .tz('Australia/Sydney')
        .format('dddd D MMMM, YYYY')
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
      subtotal: (bookingObj.totalPrice - serviceFee).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'),
      serviceFee: serviceFee.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'),
      basePrice: bookingObj.basePrice.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'),
      total: bookingObj.totalPrice.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'),
      priceType: bookingObj.priceType,
      listAddress: `${locationObj.address1}, ${locationObj.city}`,
      listingId: listingObj.id,
      listImage: coverPhoto,
      category: categoryAndSubObj.category,
      appLink: process.env.NEW_LISTING_PROCESS_HOST,
      totalPeriod: totalPeriod,
      message: bookingObj.message,
      valueDiscount: discountValue > 0 ? discountValue.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,') : null,
      capacity: listingData.personCapacity ? listingData.personCapacity : 1,
      minimumTerm,
      term
    }
    await senderService.senderByTemplateData('booking-request-email-guest', guestObj.email, guestMetadata)
  },

  /**
   * Email approved and ready to be paid.
   */
  sendEmailReadyToPay: async bookingId => {
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
      bookingObj.priceType === 'hourly'
        ? bookingObj.checkInHour
        : checkInObj
        ? checkInObj.allday === 1
          ? '24 hours'
          : moment(checkInObj.openHour)
              .tz('Australia/Sydney')
              .format('h:mm a')
        : 'Closed'
    let checkOutObj = await getCheckInOutTime(listingObj.id, bookingObj.checkOut)
    let checkOutTime =
      bookingObj.priceType === 'hourly'
        ? bookingObj.checkOutHour
        : checkOutObj
        ? checkOutObj.allday === 1
          ? '24 hours'
          : moment(checkOutObj.closeHour)
              .tz('Australia/Sydney')
              .format('h:mm a')
        : 'Closed'
    const IS_ABSORVE = 0.035
    const NO_ABSORVE = 0.135
    let serviceFee = bookingObj.basePrice * bookingObj.period * IS_ABSORVE
    const userProfilePicture = await listingCommons.getProfilePicture(bookingObj.hostId)
    const coverPhoto = await listingCommons.getCoverPhotoPath(listingObj.id)
    const categoryAndSubObj = await listingCommons.getCategoryAndSubNames(listingObj.listSettingsParentId)
    const quantity = bookingObj.period
    const totalPeriod = await listingCommons.getPeriodFormatted(quantity, bookingObj.priceType)
    let minimumTerm = listingData.minTerm ? listingData.minTerm : 1
    let term = 'day'
    if (listing.bookingPeriod !== 'daily') term = listing.bookingPeriod.replace('ly', '')
    if (minimumTerm > 1) term = term + 's'
    const guestMetadata = {
      bookingId: bookingId,
      user: guestObj.firstName,
      hostName: hostObj.firstName,
      hostPhoto: hostObj.picture,
      guestName: guestObj.firstName,
      listCity: locationObj.city,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      checkinDateShort: checkInShort,
      profilePicture: userProfilePicture,
      listTitle: listingObj.title,
      fullAddress: `${locationObj.address1}, ${locationObj.city}`,
      basePrice: bookingObj.basePrice.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'),
      totalPeriod: totalPeriod,
      subtotal: (bookingObj.totalPrice - serviceFee).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'),
      serviceFee: serviceFee.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'),
      total: bookingObj.totalPrice.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'),
      priceType: bookingObj.priceType,
      currentDate: moment()
        .tz('Australia/Sydney')
        .format('dddd D MMMM, YYYY')
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
      category: categoryAndSubObj.category,
      appLink: process.env.NEW_LISTING_PROCESS_HOST,
      listingId: listingObj.id,
      capacity: listingData.personCapacity ? listingData.personCapacity : 1,
      minimumTerm,
      term
    }
    await senderService.senderByTemplateData('booking-ready-to-pay-email', guestObj.email, guestMetadata)
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
        .format('dddd D MMMM, YYYY')
        .toString(),
      listTitle: listingObj.title
    }
    await senderService.senderByTemplateData('booking-declined-email', guestObj.email, declinedMetadata)
    const smsMessage = {
      message: 'You booking has been declined on Spacenow',
      sender: 'Spacenow',
      receiver: guestObj.phoneNumber
    }
    console.log('SMS Message ===>>>', smsMessage)
    await axios.post(`${process.env.NOTIFICATION_API}/send-sms-message`, JSON.stringify(smsMessage))
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
      hostName: hostObj.firstName,
      link: `${reviewPageLink}/guest`,
      currentDate: moment()
        .tz('Australia/Sydney')
        .format('dddd D MMMM, YYYY')
        .toString()
    })
    await senderService.senderByTemplateData('booking-request-review-host', hostObj.email, {
      guestName: guestObj.firstName,
      link: `${reviewPageLink}/host`,
      currentDate: moment()
        .tz('Australia/Sydney')
        .format('dddd D MMMM, YYYY')
        .toString()
    })

    const smsMessageGuest = {
      message: 'Your check-out time is approaching',
      sender: 'Spacenow',
      receiver: guestObj.phoneNumber
    }
    const smsMessageHost = {
      message: 'Your guest check-out time is approaching',
      sender: 'Spacenow',
      receiver: hostObj.phoneNumber
    }
    // console.log('SMS Message ===>>>', smsMessage)
    await axios.post(`${process.env.NOTIFICATION_API}/send-sms-message`, JSON.stringify(smsMessageGuest))
    await axios.post(`${process.env.NOTIFICATION_API}/send-sms-message`, JSON.stringify(smsMessageHost))
  },

  /**
   * Send an email when bookings has expired.
   */
  sendEmailExpiredBooking: async bookingId => {
    const { data: bookingObj } = await getBookingById(bookingId)
    const hostObj = await getUserById(bookingObj.hostId)
    const guestObj = await getUserById(bookingObj.guestId)
    const listingObj = await listingCommons.getListingById(bookingObj.listingId)
    const locationObj = await Location.findOne({
      where: { id: listingObj.locationId }
    })
    const listingData = await ListingData.findOne({
      where: { listingId: listingObj.id }
    })
    // const valuesMessage = {
    //   where: {
    //     listingId: listingObj.id,
    //     hostId: bookingObj.hostId,
    //     guestId: bookingObj.guestId
    //   }
    // }
    // let messageData = await Message.findOne(valuesMessage)
    // if (!messageData) {
    //   messageData = await Message.create(valuesMessage.where)
    // }
    let minimumTerm = listingData.minTerm ? listingData.minTerm : 1
    let term = 'day'
    if (listingObj.bookingPeriod !== 'daily') term = listingObj.bookingPeriod.replace('ly', '')
    if (minimumTerm > 1) term = term + 's'
    const checkIn = moment(bookingObj.checkIn)
      .tz('Australia/Sydney')
      .format('ddd, Do MMM, YYYY')
      .toString()
    const coverPhoto = await listingCommons.getCoverPhotoPath(listingObj.id)
    const categoryAndSubObj = await listingCommons.getCategoryAndSubNames(listingObj.listSettingsParentId)
    let emailData = {
      guestName: guestObj.firstName,
      hostName: hostObj.firstName,
      hostPhoto: hostObj.picture,
      checkInDate: checkIn,
      listingPhoto: coverPhoto,
      listingTitle: listingObj.title,
      listingAddress: `${locationObj.address1}, ${locationObj.city}`,
      basePrice: bookingObj.basePrice.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'),
      priceType: bookingObj.priceType,
      category: categoryAndSubObj.category,
      listingId: listingObj.id,
      appLink: process.env.NEW_LISTING_PROCESS_HOST,
      currentDate: moment()
        .tz('Australia/Sydney')
        .format('dddd D MMMM, YYYY')
        .toString(),
      capacity: listingData.personCapacity ? listingData.personCapacity : 1,
      minimumTerm,
      term
    }
    console.log(emailData)
    await senderService.senderByTemplateData('booking-expiry-email-guest', guestObj.email, emailData)
    await senderService.senderByTemplateData('booking-expire-email-host', hostObj.email, emailData)
    const smsMessageGuest = {
      message: 'Your bookings has expired on Spacenow',
      sender: 'Spacenow',
      receiver: guestObj.phoneNumber
    }
    const smsMessageHost = {
      message: 'Your bookings has expired on Spacenow',
      sender: 'Spacenow',
      receiver: hostObj.phoneNumber
    }
    // console.log('SMS Message ===>>>', smsMessage)
    await axios.post(`${process.env.NOTIFICATION_API}/send-sms-message`, JSON.stringify(smsMessageGuest))
    await axios.post(`${process.env.NOTIFICATION_API}/send-sms-message`, JSON.stringify(smsMessageHost))
  }
}
