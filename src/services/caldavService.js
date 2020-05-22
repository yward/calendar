/**
 * @copyright Copyright (c) 2020 Georg Ehrke
 *
 * @author Georg Ehrke <oc.list@georgehrke.com>
 *
 * @license GNU AGPL version 3 or any later version
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 */
import DavClient from 'cdav-library'
import { generateRemoteUrl } from '@nextcloud/router'
import { getRequestToken } from '@nextcloud/auth'
import { CALDAV_BIRTHDAY_CALENDAR } from '../models/consts.js'

const xhrProvider = () => {
	const headers = {
		'X-Requested-With': 'XMLHttpRequest',
		'requesttoken': getRequestToken(),
		'X-NC-CalDAV-Webcal-Caching': 'On',
	}
	const xhr = new XMLHttpRequest()
	const oldOpen = xhr.open

	// override open() method to add headers
	xhr.open = function() {
		const result = oldOpen.apply(this, arguments)
		for (const name in headers) {
			xhr.setRequestHeader(name, headers[name])
		}

		return result
	}

	OC.registerXHRForErrorProcessing(xhr) // eslint-disable-line no-undef
	return xhr
}

const client = new DavClient({
	rootUrl: generateRemoteUrl('dav'),
}, xhrProvider)

/**
 * Initializes the client for use in the user-view
 */
const initializeClientForUserView = () => {
	client.connect({ enableCalDAV: true })
}

/**
 * Initializes the client for use in the public/embed-view
 */
const initializeClientForPublicView = () => {
	client._createPublicCalendarHome()
}

/**
 * Fetch all calendars from the server
 *
 * @returns {Promise<Calendar[]>}
 */
const findAllCalendars = () => {
	return client.calendarHomes[0].findAllCalendars()
}

/**
 * Fetch public calendars by their token
 *
 * @param {String[]} tokens List of tokens
 * @returns {Promise<Calendar[]>}
 */
const findPublicCalendarsByToken = async(tokens) => {
	const findPromises = []

	for (const token of tokens) {
		const promise = client.publicCalendarHome
			.find(token)
			.catch(() => null) // Catch outdated tokens

		findPromises.push(promise)
	}

	const calendars = await Promise.all(findPromises)
	return calendars.filter((calendar) => calendar !== null)
}

/**
 * Creates a calendar
 *
 * @param {String} displayName Visible name
 * @param {String} color Color
 * @param {String[]} components Supported component set
 * @param {Number} order Order of calendar in list
 * @param {String} timezoneIcs ICS representation of timezone
 * @returns {Promise<Calendar>}
 */
const createCalendar = async(displayName, color, components, order, timezoneIcs) => {
	return client.calendarHomes[0].createCalendarCollection(displayName, color, components, order, timezoneIcs)
}

/**
 * Creates a subscription
 *
 * This function does not return a subscription, but a cached calendar
 *
 * @param {String} displayName Visible name
 * @param {String} color Color
 * @param {String} source Link to WebCAL Source
 * @param {Number} order Order of calendar in list
 * @returns {Promise<Calendar>}
 */
const createSubscription = async(displayName, color, source, order) => {
	return client.calendarHomes[0].createSubscribedCollection(displayName, color, source, order)
}

/**
 * Enables the birthday calendar
 */
const enableBirthdayCalendar = async() => {
	await client.calendarHomes[0].enableBirthdayCalendar()
	return getBirthdayCalendar()
}

/**
 * Gets the birthday calendar
 *
 * @returns {Promise<Calendar>}
 */
const getBirthdayCalendar = async() => {
	return client.calendarHomes[0].find(CALDAV_BIRTHDAY_CALENDAR)
}

export default client
export {
	initializeClientForUserView,
	initializeClientForPublicView,
	findAllCalendars,
	findPublicCalendarsByToken,
	createCalendar,
	createSubscription,
	enableBirthdayCalendar,
	getBirthdayCalendar,
}
