'use strict'

const moment = require('moment')
const Sequelize = require('sequelize')
const senderService = require('./sender')
const listingCommons = require('./../helpers/listings.common')
const Op = Sequelize.Op

const { User, UserProfile, Message, MessageItem, MessageHost, Location, ListingData } = require('./../models')

const sendEmailNewMessageHost = async messageItemId => {
  try {
    let emailObj
    let currentDate = moment()
      .tz('Australia/Sydney')
      .format('dddd D MMMM, YYYY')
      .toString()

    const messageItemObj = await MessageItem.findOne({
      where: {
        id: messageItemId
      }
    })
    const messageObj = await Message.findOne({
      where: {
        id: messageItemObj.messageId
      }
    })
    const hostObj = await User.findOne({
      where: { id: messageObj.hostId }
    })
    const hostProfileObj = await UserProfile.findOne({
      where: { userId: messageObj.hostId }
    })
    const guestProfileObj = await UserProfile.findOne({
      where: { userId: messageObj.guestId }
    })

    emailObj = {
      currentDate,
      appLink: process.env.NEW_LISTING_PROCESS_HOST,
      messageId: messageObj.id,
      hostName: hostProfileObj.firstName,
      guestName: guestProfileObj.firstName,
      guestPhoto: await listingCommons.getProfilePicture(messageObj.guestId),
      message: messageItemObj.content
    }
    await senderService.senderByTemplateData('message-host-email', hostObj.email, emailObj)
  } catch (err) {
    console.error(err)
    return err
  }
}

const sendEmailNewMessageGuest = async messageItemId => {
  try {
    let emailObj
    let currentDate = moment()
      .tz('Australia/Sydney')
      .format('dddd D MMMM, YYYY')
      .toString()

    const messageItemObj = await MessageItem.findOne({
      where: {
        id: messageItemId
      }
    })
    const messageObj = await Message.findOne({
      where: {
        id: messageItemObj.messageId
      }
    })
    const guestObj = await User.findOne({
      where: { id: messageObj.guestId }
    })
    const hostProfileObj = await UserProfile.findOne({
      where: { userId: messageObj.hostId }
    })
    const guestProfileObj = await UserProfile.findOne({
      where: { userId: messageObj.guestId }
    })

    emailObj = {
      currentDate,
      appLink: process.env.NEW_LISTING_PROCESS_HOST,
      messageId: messageObj.id,
      hostName: hostProfileObj.firstName,
      guestName: guestProfileObj.firstName,
      hostPhoto: await listingCommons.getProfilePicture(messageObj.hostId),
      message: messageItemObj.content
    }
    await senderService.senderByTemplateData('message-guest-email', guestObj.email, emailObj)
  } catch (err) {
    console.error(err)
    return err
  }
}

module.exports = {
  sendEmailMessageNotification: async () => {
    try {
      const pastOneHour = moment()
        .subtract(1, 'hours')
        .utc()

      const pastTwoHour = moment()
        .subtract(2, 'hours')
        .utc()

      const messageItemsObj = await MessageItem.findAll({
        where: {
          isRead: 0,
          createdAt: { [Op.between]: [pastTwoHour, pastOneHour] }
        },
        // group: ['messageId', 'content'],
        order: [['createdAt', 'DESC']],
        include: [{ all: true, nested: true }]
      })

      const groupedObj = messageItemsObj.reduce(
        (objectsByKeyValue, obj) => ({
          ...objectsByKeyValue,
          [obj['messageId']]: (objectsByKeyValue[obj['messageId']] || []).concat(obj)
        }),
        {}
      )
      const messageItemValues = Object.values(groupedObj)
      for (const messageItem of messageItemValues) {
        try {
          const messageObj = await Message.findByPk(messageItem[0].messageId)
          // Avoid sending message notification email when first message coming 
          // from inspection or contact host form. They have their own email
          if (messageItem.length > 1) { 
            if (messageObj.hostId === messageItem[0].sentBy) {
              await sendEmailNewMessageGuest(messageItem[0].id)
            } else {
              await sendEmailNewMessageHost(messageItem[0].id)
            }
          } 
        } catch (err) {
          return err
        }
      }
    } catch (err) {
      return err
    }
  },

  sendEmailInspectionNotification: async messageId => {
    try {
      let emailObj
      let currentDate = moment()
        .tz('Australia/Sydney')
        .format('dddd D MMMM, YYYY')
        .toString()

      const messageParentObj = await MessageHost.findOne({
        where: {
          messageId
        }
      })
      const messageItemObj = await MessageItem.findAll({
        where: {
          messageId
        }
      })
      const messageObj = await Message.findOne({
        where: {
          id: messageId
        }
      })
      const listingObj = await listingCommons.getListingById(messageObj.listingId)
      const locationObj = await Location.findOne({
        where: { id: listingObj.locationId }
      })
      const listingData = await ListingData.findOne({
        where: { listingId: listingObj.id }
      })
      const guestObj = await User.findOne({
        where: { id: messageObj.guestId }
      })
      const hostObj = await User.findOne({
        where: { id: messageObj.hostId }
      })
      const hostProfileObj = await UserProfile.findOne({
        where: { userId: messageObj.hostId }
      })
      const guestProfileObj = await UserProfile.findOne({
        where: { userId: messageObj.guestId }
      })
      const coverPhoto = await listingCommons.getCoverPhotoPath(listingObj.id)
      const categoryAndSubObj = await listingCommons.getCategoryAndSubNames(listingObj.listSettingsParentId)
      let minimumTerm = listingData.minTerm ? listingData.minTerm : 1
      let term = 'day'
      if (listingObj.bookingPeriod !== 'daily') term = listingObj.bookingPeriod.replace('ly', '')
      if (minimumTerm > 1) term = term + 's'

      const time = messageParentObj.startTime.split(':')
      const momentObj = moment()
      momentObj.set({ hours: time[0], minutes: time[1] })

      emailObj = {
        currentDate,
        appLink: process.env.NEW_LISTING_PROCESS_HOST,
        messageId,
        hostName: hostProfileObj.displayName,
        hostEmail: hostObj.email,
        hostPhone: hostProfileObj.phoneNumber || 'none',
        guestName: guestProfileObj.displayName,
        guestEmail: guestObj.email,
        guestPhone: guestProfileObj.phoneNumber || 'none',
        date: moment(messageParentObj.reservations)
          .tz('Australia/Sydney')
          .format('dddd D MMMM, YYYY')
          .toString(),
        time: momentObj.format('h:mm A'),
        message: messageItemObj[0].content,
        capacity: listingData.capacity ? listingData.capacity : 1,
        minimumTerm,
        term,
        listingId: listingObj.id,
        basePrice: listingData.basePrice.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'),
        priceType: listingObj.bookingPeriod,
        listImage: coverPhoto,
        category: categoryAndSubObj.category,
        listTitle: listingObj.title,
        fullAddress: `${locationObj.address1 ? `${locationObj.address1}, ` : ''}${locationObj.city}`,
        hostPhoto: await listingCommons.getProfilePicture(messageObj.hostId)
      }
      await senderService.senderByTemplateData('inspection-guest-email', guestObj.email, {
        ...emailObj
      })
      // await senderService.senderByTemplateData('inspection-host-email', hostObj.email, {
      //   ...emailObj,
      //   guestPhoto: await listingCommons.getProfilePicture(messageObj.guestId)
      // })
      await senderService.senderByTemplateData('inspection-team-email', 'team@spacenow.com', {
        ...emailObj
      })
      return messageObj
    } catch (err) {
      console.log('err', err)
      return err
    }
  },

  sendEmailCancelInspectionNotification: async messageId => {
    try {
      let emailObj
      let currentDate = moment()
        .tz('Australia/Sydney')
        .format('dddd D MMMM, YYYY')
        .toString()

      const messageParentObj = await MessageHost.findOne({
        where: {
          messageId
        }
      })
      const messageItemObj = await MessageItem.findAll({
        where: {
          messageId
        }
      })
      const messageObj = await Message.findOne({
        where: {
          id: messageId
        }
      })
      const listingObj = await listingCommons.getListingById(messageObj.listingId)
      const locationObj = await Location.findOne({
        where: { id: listingObj.locationId }
      })
      const listingData = await ListingData.findOne({
        where: { listingId: listingObj.id }
      })
      const guestObj = await User.findOne({
        where: { id: messageObj.guestId }
      })
      const hostObj = await User.findOne({
        where: { id: messageObj.hostId }
      })
      const hostProfileObj = await UserProfile.findOne({
        where: { userId: messageObj.hostId }
      })
      const guestProfileObj = await UserProfile.findOne({
        where: { userId: messageObj.guestId }
      })
      await MessageItem.findOrCreate({
        where: {
          messageId: messageId,
          content: 'Site inspection cancelled',
          sentBy: guestObj.id
        }
      })

      const coverPhoto = await listingCommons.getCoverPhotoPath(listingObj.id)
      const categoryAndSubObj = await listingCommons.getCategoryAndSubNames(listingObj.listSettingsParentId)
      let minimumTerm = listingData.minTerm ? listingData.minTerm : 1
      let term = 'day'
      if (listingObj.bookingPeriod !== 'daily') term = listingObj.bookingPeriod.replace('ly', '')
      if (minimumTerm > 1) term = term + 's'

      const time = messageParentObj.startTime.split(':')
      const momentObj = moment()
      momentObj.set({ hours: time[0], minutes: time[1] })

      emailObj = {
        currentDate,
        appLink: process.env.NEW_LISTING_PROCESS_HOST,
        messageId,
        hostName: hostProfileObj.displayName,
        hostEmail: hostObj.email,
        hostPhone: hostProfileObj.phoneNumber || 'none',
        guestName: guestProfileObj.displayName,
        guestEmail: guestObj.email,
        guestPhone: guestProfileObj.phoneNumber || 'none',
        date: moment(messageParentObj.reservations)
          .tz('Australia/Sydney')
          .format('dddd D MMMM, YYYY')
          .toString(),
        time: momentObj.format('h:mm A'),
        message: messageItemObj[0].content,
        capacity: listingData.capacity ? listingData.capacity : 1,
        minimumTerm,
        term,
        listingId: listingObj.id,
        basePrice: listingData.basePrice.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'),
        priceType: listingObj.bookingPeriod,
        listImage: coverPhoto,
        category: categoryAndSubObj.category,
        listTitle: listingObj.title,
        fullAddress: `${locationObj.address1 ? `${locationObj.address1}, ` : ''}${locationObj.city}`,
        hostPhoto: await listingCommons.getProfilePicture(messageObj.hostId)
      }
      await senderService.senderByTemplateData('inspection-cancel-team-email', 'team@spacenow.com', {
        ...emailObj
      })
      await senderService.senderByTemplateData('inspection-cancel-guest-email', guestObj.email, {
        ...emailObj
      })

      return messageObj
    } catch (err) {
      console.log('err', err)
      return err
    }
  }
}
