<!--
  - @copyright Copyright (c) 2019 Georg Ehrke <oc.list@georgehrke.com>
  - @author Georg Ehrke <oc.list@georgehrke.com>
  -
  - @license GNU AGPL version 3 or any later version
  -
  - This program is free software: you can redistribute it and/or modify
  - it under the terms of the GNU Affero General Public License as
  - published by the Free Software Foundation, either version 3 of the
  - License, or (at your option) any later version.
  -
  - This program is distributed in the hope that it will be useful,
  - but WITHOUT ANY WARRANTY; without even the implied warranty of
  - MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
  - GNU Affero General Public License for more details.
  -
  - You should have received a copy of the GNU Affero General Public License
  - along with this program. If not, see <http://www.gnu.org/licenses/>.
  -
  -->

<template>
	<draggable
		v-model="calendars"
		draggable=".draggable-calendar-list-item"
		@update="update">
		<template v-if="!isPublic">
			<CalendarListItem
				v-for="calendar in calendars"
				:key="calendar.id"
				class="draggable-calendar-list-item"
				:calendar="calendar" />
		</template>
		<template v-else>
			<PublicCalendarListItem
				v-for="calendar in calendars"
				:key="calendar.id"
				:calendar="calendar" />
		</template>
		<!-- The header slot must be placed here, otherwise vuedraggable adds undefined as item to the array -->
		<CalendarListItemLoadingPlaceholder v-if="loadingCalendars" slot="header" :key="loadingKeyCalendars" />
	</draggable>
</template>

<script>
import CalendarListItem from './CalendarList/CalendarListItem.vue'
import PublicCalendarListItem from './CalendarList/PublicCalendarListItem.vue'
import CalendarListItemLoadingPlaceholder from './CalendarList/CalendarListItemLoadingPlaceholder.vue'
import draggable from 'vuedraggable'
import pDebounce from 'p-debounce'
import { mapGetters } from 'vuex'
import { showError } from '@nextcloud/dialogs'
import pLimit from 'p-limit'

const limit = pLimit(1)

export default {
	name: 'CalendarList',
	components: {
		CalendarListItem,
		CalendarListItemLoadingPlaceholder,
		PublicCalendarListItem,
		draggable,
	},
	props: {
		isPublic: {
			type: Boolean,
			required: true,
		},
		loadingCalendars: {
			type: Boolean,
			default: false,
		},
	},
	data() {
		return {
			calendars: [],
		}
	},
	computed: {
		...mapGetters({
			serverCalendars: 'sortedCalendarsSubscriptions',
		}),
		loadingKeyCalendars() {
			return this._uid + '-loading-placeholder-calendars'
		},
	},
	watch: {
		serverCalendars(val) {
			console.debug(val)
			this.calendars = val
		},
	},
	methods: {
		update: pDebounce(limit(async function() {
			console.debug(this.calendars)
			const newOrder = this.calendars.reduce((newOrderObj, currentItem, currentIndex) => {
				newOrderObj[currentItem.id] = currentIndex
				return newOrderObj
			}, {})

			try {
				await this.$store.dispatch('updateCalendarListOrder', { newOrder })
			} catch (err) {
				showError(this.$t('calendar', 'Could not update calendar order.'))
				// Reset calendar list order on error
				this.calendars = this.serverCalendars
			}
		}), 5000),
	},
}
</script>
