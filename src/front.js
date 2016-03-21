var DateTime = require('dateutils').DateTime
var DateFormat = require('dateutils').DateFormat
var DateLocale = require('dateutils').DateLocale
var attachFastClick = require('fastclick')
var navigation = require('./navigation')
attachFastClick(document.body)
var markupForDateRange = require('./markupForDateRange')
var locations = require('../generated/locations')
const format = require('./format')
var didScroll = false
var alreadyLoadingMoreResults = false
var today = DateTime.fromIsoDate(window.serverDate)
var activeDate = today.plusDays(2)
const body = document.body
window.addEventListener('scroll', () => { didScroll = true })
setInterval(() => {
    if (didScroll) {
        didScroll = false
        if (!alreadyLoadingMoreResults && body.scrollTop + window.innerHeight > body.scrollHeight - 400) {
            loadMoreResults(5)
            ga('send', 'event', 'Scroll to end', today.distanceInDays(activeDate))
        }
    }
}, 250)
var schedule = document.getElementById('schedule')
navigation.init()
listAvailabilityForActiveDate(30)
var reservationModal = document.querySelector('.reservationModal')
reservationModal.addEventListener('click', e => {
    var clickArea = e.target
    if (clickArea.classList.contains('close')) {
        reservationModal.style.display = 'none'
    }
})
schedule.addEventListener('click', e => {
    var clickArea = e.target
    var openAction = clickArea.classList.contains('locationLabel')
    if (openAction) {
        var locationBoxes = clickArea.parentNode
        var fields = JSON.parse(locationBoxes.getAttribute('data-fields'))
        reservationModal.innerHTML = reservationModalMarkup(fields)
        reservationModal.style.display = 'block'
        var distance = today.distanceInDays(DateTime.fromIsoDate(fields.date))
        ga('send', 'event', 'Reservation', distance)
    }
})

elems('.locationMap .close, .information .close')
    .forEach(el => el.addEventListener('click', e => e.target.parentNode.style.display = 'none'))

function loadMoreResults(days) {
    if (!alreadyLoadingMoreResults) {
        alreadyLoadingMoreResults = true
        listAvailabilityForActiveDate(days)
    }
}

function reservationModalMarkup(obj) {
    var dateTime = DateTime.fromIsoDate(obj.date)
    var currentLocation = obj.location
    var locationObject = locations.find(location => location.title === currentLocation)
    var address = locationObject.address
    var url = locationObject.url
    var tel = locationObject.tel

    return `<h2>${currentLocation}</h2> <p>${format.formatDate(dateTime)} klo ${obj.time}</p>
        <h3>Lisää kalenteriin</h3> <div class="fields">${obj.fields.map(toButtonMarkup).join('')}</div>
        <h3>Tiedot</h3>
        ${linksMarkup(locationObject)}
        <div class="close">&times;</div>`

    function toButtonMarkup(field) {
        const urlParams = encodeUrl({
            location: currentLocation,
            field:    field.field,
            price:    field.price,
            tel:      tel,
            date:     obj.date,
            time:     obj.time,
            address:  address,
            url:      url
        })
        const classes = [
            'button',
            'fieldLabel',
            obj.location,
            field.type,
            format.durationClass(field.doubleLesson)
        ].join(' ')
        return `<a href="/calendar?${urlParams}" class="${classes}">${field.field}<br/>${format.formatPrice(field.price)}</a>`
    }
}

function linksMarkup(locationObject) {
    var address = locationObject.address
    var url = locationObject.url
    var tel = locationObject.tel
    return `<div class="links"><div><a class="tel"
    onclick="ga('send', 'event', 'Telephone', '${locationObject.title}'); return true;" href="tel:${tel}">${tel}</a></div>
    <div><a class="map" target="_blank"
    onclick="ga('send', 'event', 'Map', '${locationObject.title}'); return true;" href="http://maps.google.com/?q=${address}">${address}</a></div>` +
        (url ? `<div><a target="_blank" onclick="ga('send', 'event', 'Booking', '${locationObject.title}'); return true;" href="${url}">Siirry varausjärjestelmään</a></div>` : '') + '</div>'
}

function listAvailabilityForActiveDate(days) {
    var requestedDate = activeDate.toISODateString()
    activeDate = activeDate.plusDays(days - 1)
    schedule.classList.add('loading')
    alreadyLoadingMoreResults = true
    const urlParams = encodeUrl({
        date:    requestedDate,
        days:    days,
        refresh: window.refresh
    })
    getJson(`/courts?${urlParams}`, allDataWithDates => {
        schedule.classList.remove('loading')
        schedule.innerHTML += markupForDateRange(allDataWithDates, today)
        alreadyLoadingMoreResults = false
    })
}

function getJson(url, cb) {
    var request = new XMLHttpRequest()
    request.open('GET', url, true)
    request.onload = () => {
        if (request.status >= 200 && request.status < 400) {
            cb(JSON.parse(request.responseText))
        } else {
            console.error('Error with ajax request')
        }
    }
    request.onerror = () => console.error('There was a connection error of some sort')
    request.send()
}

function encodeUrl(obj) {
    return encodeURI(Object.keys(obj).map(k=>k + '=' + obj[k]).join('&'))
}

function elems(selector) { return Array.prototype.slice.call(document.querySelectorAll(selector)) }
