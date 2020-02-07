'use strict'

const moment = require('moment')
const Sequelize = require('sequelize')
const senderService = require('./sender')
const listingCommons = require('./../helpers/listings.common')
const Op = Sequelize.Op

const { User, UserProfile, Message, MessageItem, MessageHost } = require('./../models')

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
        .subtract(1, 'hours')
        .utc()

      const messageItemsObj = await MessageItem.findAll({
        where: {
          isRead: 0,
          createdAt: { [Op.between]: [pastOneHour, pastTwoHour] }
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
          if (messageObj.hostId === messageItem[0].sentBy) {
            await sendEmailNewMessageGuest(messageItem[0].id)
          } else {
            await sendEmailNewMessageHost(messageItem[0].id)
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
      const messageItemObj = await MessageItem.find({
        where: {
          messageId
        }
      })
      const messageObj = await Message.findOne({
        where: {
          id: messageId
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
        messageId,
        hostName: hostProfileObj.firstName,
        guestName: guestProfileObj.firstName,
        guestPhoto: await listingCommons.getProfilePicture(messageObj.guestId),
        date: messageParentObj.reservations[0],
        time: messageParentObj.startTime,
        message: messageItemObj[0].content
      }
      console.log(emailObj)
      console.log({
        ...emailObj,
        hostPhoto: await listingCommons.getProfilePicture(messageObj.hostId)
      })
      console.log({
        ...emailObj,
        guestPhoto: await listingCommons.getProfilePicture(messageObj.guestId)
      })
      await senderService.senderByTemplateData('inspection-guest-email', guestObj.email, {
        ...emailObj,
        hostPhoto: await listingCommons.getProfilePicture(messageObj.hostId)
      })
      await senderService.senderByTemplateData('inspection-host-email', hostObj.email, {
        ...emailObj,
        guestPhoto: await listingCommons.getProfilePicture(messageObj.guestId)
      })
    } catch (err) {
      return err
    }
  }
}
