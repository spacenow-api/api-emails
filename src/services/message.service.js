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
    try {
      const pastTwoHour = moment()
        .subtract(2, 'hours')
        .utc()
      const pastHour = moment()
        .subtract(1, 'hours')
        .utc()

      const date = moment().utc()

      const messageItemsObj = await MessageItem.findAll({
        where: {
          isRead: 0,
          // createdAt: { [Op.between]: [pastTwoHour, pastHour] }
          createdAt: { [Op.between]: [pastHour, date] } // testing pourposes
        },
        group: ['messageId', 'content'],
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

      messageItemValues.forEach(async item => {
        console.log('item', item)
        console.log('typeof item[0]', typeof item[0].messageId)
        // try {
        const messageObj = await Message.findOne({
          where: {
            id: item[0].messageId
          }
        })
        console.log('messageObj', messageObj)
        if (messageObj.hostId === item[0].sendBy) {
          console.log('messageObj.hostId', messageObj.hostId)
          console.log('item[0].sendBy', item[0].sendBy)
          sendEmailNewMessageHost(item[0].id)
        } else if (messageObj.guestId === item[0].sendBy) {
          console.log('messageObj.guestId', messageObj.guestId)
          console.log('item[0].sendBy', item[0].sendBy)
          sendEmailNewMessageGuest(item[0].id)
        } else {
          console.log('no envia')
          console.log('item[0].sendBy', item[0].sendBy)
          console.log('messageObj.hostId', messageObj.hostId)
        }
        // } catch (err) {
        //   console.log('err', err)
        // }
      })
      // return messageItemValues
    } catch (err) {
      console.error(err)
      return err
    }
  }
}
