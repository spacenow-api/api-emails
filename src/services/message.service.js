'use strict'

const moment = require('moment')
const Sequelize = require('sequelize')
const senderService = require('./sender')

const { User, UserProfile, Message } = require('./../models')

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

      const messageItemObj = await MessageItem.find({
        where: {
          id: messageItemId
        }
      })
      const messageObj = await Message.find({
        where: {
          id: messageItemObj.messageId
        }
      })
      const hostObj = await User.findOne({
        where: { userId: messageObj.hostId }
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
        guestLocation: guestProfileObj.location,
        message: messageItem.content
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

      const messageItemObj = await MessageItem.find({
        where: {
          id: messageItemId
        }
      })
      const messageObj = await Message.find({
        where: {
          id: messageItemObj.messageId
        }
      })
      const guestObj = await User.findOne({
        where: { userId: messageObj.guestId }
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
        hostLocation: guestProfileObj.location,
        message: messageItem.content
      }
      await senderService.senderByTemplateData('message-guest-email', guestObj.email, emailObj)
    } catch (err) {
      console.error(err)
      return err
    }
  }
}
