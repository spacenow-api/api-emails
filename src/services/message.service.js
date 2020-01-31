'use strict'

const moment = require('moment')
const Sequelize = require('sequelize')
const senderService = require('./sender')
const listingCommons = require('./../helpers/listings.common')
const Op = Sequelize.Op

const { User, UserProfile, Message, MessageItem } = require('./../models')

const sendEmailNewMessageHost = async messageItemId => {
  console.log('function host')
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
    console.log('emailObj host', emailObj)
    await senderService.senderByTemplateData('message-host-email', hostObj.email, emailObj)
  } catch (err) {
    console.error(err)
    return err
  }
}

const sendEmailNewMessageGuest = async messageItemId => {
  console.log('function guest')
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
    console.log('emailObj', emailObj)
    await senderService.senderByTemplateData('message-guest-email', guestObj.email, emailObj)
  } catch (err) {
    console.error(err)
    return err
  }
}

module.exports = {
  sendEmailMessageNotification: async () => {
    try {
      const pastHour = moment()
        .subtract(1, 'hours')
        .utc()

      const date = moment().utc()

      const messageItemsObj = await MessageItem.findAll({
        where: {
          isRead: 0,
          createdAt: { [Op.between]: [pastHour, date] }
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
            console.log('to guest', messageItem[0].id)
            await sendEmailNewMessageGuest(messageItem[0].id)
          } else {
            console.log('to host ', messageItem[0].id)
            await sendEmailNewMessageHost(messageItem[0].id)
          }
        } catch (err) {
          return err
        }
      }
    } catch (err) {
      return err
    }
  }
}
