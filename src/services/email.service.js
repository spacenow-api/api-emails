'use strict'

const crypto = require('crypto')
const axios = require('axios')
const moment = require('moment')

const {
  UserProfile,
  ListingPhotos,
  ListSettings,
  ListSettingsParent,
  ListingAccessDays,
  ListingAccessHours
} = require('./../models')

async function send(templateName, destination, templateData) {
  try {
    const { data } = await axios.post(`${process.env.EMAILS_API}/email/send`, {
      template: templateName,
      data: JSON.stringify({ email: destination, ...templateData })
    });
    console.info(`Email '${templateName}' send with success to '${destination}'.\nMessage ID: ${data.MessageId}`)
  } catch (err) {
    console.error(`Problems to send email '${templateName}' to '${destination}'.\nError: `, err)
  }
}

async function getCoverPhotoPath(listingId) {
  const listingPhotosArray = await ListingPhotos.findAll({ where: { listingId } })
  if (listingPhotosArray && listingPhotosArray.length > 0) {
    const coverPhoto = listingPhotosArray.filter(o => o.isCover)
    if (coverPhoto && coverPhoto.length > 0)
      return coverPhoto[0].name
    return listingPhotosArray[0].name
  }
  return ''
}

async function getCategoryAndSubNames(listSettingsParentId) {
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
  return { category: categoryObj.itemName, subCaregory: subCategoryObj.itemName }
}

async function getProfilePicture(userId) {
  const userProfileObj = await UserProfile.findOne({ where: { userId } })
  if (userProfileObj)
    return userProfileObj.picture
  return ''
}

async function getTimeAvailability(listingId) {
  const accessDaysObj = await ListingAccessDays.findOne({ where: { listingId }, attributes: ['id'] })
  const accessHours = await ListingAccessHours.findAll({ where: { listingAccessDaysId: accessDaysObj.id } })
  let availability = []
  for (let i = 0; i < 7; i += 1) {
    let dayValue = ""
    const dayOf = accessHours.find(o => o.weekday == i)
    if (dayOf && dayOf.allday) {
      dayValue = '24 Hours'
    } else if (dayOf) {
      const hourOpen = moment(dayOf.openHour).tz('Australia/Sydney').format('hh:mm A').toString()
      const hourClose = moment(dayOf.closeHour).tz('Australia/Sydney').format('hh:mm A').toString()
      dayValue = `${hourOpen} to ${hourClose}`
    } else {
      dayValue = 'Closed'
    }
    availability[i] = dayValue
  }
  return availability
}

const _period = (reservations, periodType) => {
  let count = 1
  if (reservations && reservations.length > 0)
    count = reservations.length
  let period = ''
  switch (periodType) {
    case 'weekly': {
      period = count > 1 ? 'Weeks' : 'Week'
    }
    case 'monthly': {
      period = count > 1 ? 'Months' : 'Month'
    }
    default: {
      period = count > 1 ? 'Days' : 'Day'
    }
  }
  return `${count} ${period}`
}

const _reservations = (bookingObj) => {
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

const _round = (value) => Math.round(value * 100) / 100

const _fee = (basePrice, guestServiceFee) => _round(basePrice * guestServiceFee)

const _totalSpaceWithoutFee = (basePrice, quantity = 1, period) => _round(basePrice * quantity * period)

const _hash = value => crypto.createHash('sha256').update(value, 'utf8').digest('hex')

const _generateAcceptLink = (bookingId, hostId) => `${process.env.NEW_LISTING_PROCESS_HOST}/account/booking?b=${bookingId}&a=${_hash(hostId + 'APPROVE')}`

const _generateDeclineLink = (bookingId, hostId) => `${process.env.NEW_LISTING_PROCESS_HOST}/account/booking?b=${bookingId}&a=${_hash(hostId + 'DECLINE')}`

module.exports = {

  sendBookingConfirmation: async (bookingObj, listingObj, locationObj, hostObj, guestObj) => {
    // Base information...
    const checkIn = moment(bookingObj.checkIn).tz('Australia/Sydney').format('ddd, Do MMM, YYYY').toString()
    const checkOut = moment(bookingObj.checkOut).tz('Australia/Sydney').format('ddd, Do MMM, YYYY').toString()
    const checkInShort = moment(bookingObj.checkIn).tz('Australia/Sydney').format('Do MMM').toString()
    const categoryAndSubObj = await getCategoryAndSubNames(listingObj.listSettingsParentId)
    const coverPhoto = await getCoverPhotoPath(listingObj.id)
    const userProfilePicture = await getProfilePicture(bookingObj.hostId)
    const timeAvailability = await getTimeAvailability(listingObj.id)
    if (bookingObj.bookingType === 'instant') {
      // To host...
      const hostMetadata = {
        user: hostObj.firstName,
        hostName: hostObj.firstName,
        guestName: guestObj.firstName,
        checkinDateShort: checkInShort,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        listTitle: listingObj.title,
        listAddress: `${locationObj.address1}, ${locationObj.city}`,
        totalPeriod: `${_period(bookingObj.reservations, bookingObj.priceType)}`,
        basePrice: bookingObj.basePrice,
        priceType: bookingObj.priceType,
        coverPhoto: coverPhoto,
        categoryName: categoryAndSubObj.category,
        subCategoryName: categoryAndSubObj.subCaregory
      }
      await send('booking-instant-email-host', hostObj.email, hostMetadata)
      // To guest...
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
        totalSpace: _totalSpaceWithoutFee(bookingObj.basePrice, bookingObj.quantity, bookingObj.period),
        serviceFee: _fee(bookingObj.basePrice, bookingObj.guestServiceFee),
        totalPrice: _round(bookingObj.totalPrice),
        isDaily: bookingObj.priceType === 'daily',
        reservations: _reservations(bookingObj),
        timeTable: timeAvailability
      }
      await send('booking-instant-email-guest', guestObj.email, guestMetada)
    } else {
      // Request booking to host...
      const hostMetadata = {
        user: hostObj.firstName,
        guestName: guestObj.firstName,
        listTitle: listingObj.title,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        basePrice: bookingObj.basePrice,
        total: bookingObj.totalPrice,
        acceptLink: _generateAcceptLink(bookingObj.bookingId, hostObj.id),
        declineLink: _generateDeclineLink(bookingObj.bookingId, hostObj.id)
      }
      await send('booking-request-email-host', hostObj.email, hostMetadata)
      // To guest...
      const guestMetadata = {
        user: guestObj.firstName,
        confirmationCode: bookingObj.confirmationCode,
        checkInDate: checkIn,
        hostName: hostObj.firstName,
        listTitle: listingObj.title
      }
      await send('booking-request-email-guest', guestObj.email, guestMetadata)
    }
  }
}
