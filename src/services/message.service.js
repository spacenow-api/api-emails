'use strict'

const moment = require('moment')
const Sequelize = require('sequelize')
const senderService = require('./sender')
const Op = Sequelize.Op

const { User, UserProfile, Message, MessageItem } = require('./../models')

module.exports = {
  /**
   * Send an email to notify a message to a host user.
   */
  sendEmailNewMessageHost: async messageItemId => {
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
        guestPhoto: guestProfileObj.picture,
        message: messageItemObj.content
      }
      await senderService.senderByTemplateData('message-host-email', hostObj.email, emailObj)
    } catch (err) {
      console.error(err)
      return err
    }
  },

  /**
   * Send an email to notify a message to a host user.
   */
  sendEmailNewMessageGuest: async messageItemId => {
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
        hostPhoto: guestProfileObj.picture,
        message: messageItemObj.content
      }
      await senderService.senderByTemplateData('message-guest-email', guestObj.email, emailObj)
    } catch (err) {
      console.error(err)
      return err
    }
  },

  sendEmailMessageNotification: async () => {
    // run cron job hourly
    try {
      // bring the unread messages
      // brind the message items
      // check the last message item
      // si was sent between one and two hours from now ->  send email to the different than sentBy
      const pastHour = moment()
        .subtract(1, 'hours')
        .utc()
      const date = moment().utc()

      const messageItemsObj = await MessageItem.findAll({
        where: {
          isRead: 0,
          createdAt: { [Op.between]: [pastHour, date] }
        },
        group: ['messageId', 'content'],
        order: ['createdAt']
      })

      const groupedObj = messageItemsObj.reduce(
        (objectsByKeyValue, obj) => ({
          ...objectsByKeyValue,
          [obj['messageId']]: (objectsByKeyValue[obj['messageId']] || []).concat(obj)
        }),
        {}
      )
      const messageItemValues = Object.values(fruits)

      messageItemValues.forEach(item => {
        // sendEmailNewMessageGuest(item[0].messageId)
        console.log('item[0]', item[0])
      })
      return messageItemValues
    } catch (err) {
      console.error(err)
      return err
    }
  }
}
