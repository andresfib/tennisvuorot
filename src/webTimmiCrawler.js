#!/usr/bin/env node
var url = require('url')
var request = require('request')
var Bacon = require('baconjs').Bacon
var _ = require('lodash')

module.exports = {
    getTali:getTali
}

var cmbProfile = {
    1018: 'TALI SISÄTENNIS 1',
    1019: 'TALI SISÄTENNIS 2',
    1020: 'TALI SULKAPALLO',
    1016: 'TALI HIEKKA 1-2',
    1017: 'TALI HIEKKA 3-5',
    1021: 'TALI KESÄ 1',
    1022: 'TALI KESÄ 2',
    1023: 'TALI KESÄSULKAPALLO',
    1024: 'TALI MASSA 6-8',
    1025: 'TALI MASSA 9-11',
    2186: 'TAIVALLAHTI 1',
    2189: 'TAIVALLAHTI 2'
}

function getTali() {
    return login().flatMap(getWeek).flatMap(function (obj) {
        return weekView(obj.cookie, obj.token)
    })
}

function login() {
    return Bacon.fromNodeCallback(request.get, {
        url: 'http://webtimmi.talintenniskeskus.fi/login.do?loginName=GUEST&password=GUEST'
    }).map('.headers.set-cookie.0').map(function (cookie) {return cookie.split(';')[0]})
}

function getWeek(cookie) {
    return Bacon.fromNodeCallback(request.get, {
        url:     'http://webtimmi.talintenniskeskus.fi/getWeekView.do',
        headers: {
            Cookie: cookie
        }
    }).map('.body').map(function (markup) {
        return {
            cookie: cookie,
            token:  markup.match(/TOKEN" value="([^"]+)"/i).pop()
        }
    })
}

function weekView(cookie, token) {
    return Bacon.fromNodeCallback(request.post, {
        url:     'http://webtimmi.talintenniskeskus.fi/weekViewMenu.do',
        headers: {
            Cookie: cookie
        },
        form:    {
            'org.apache.struts.taglib.html.TOKEN': token,
            //roomPartIds:'5743|5744|5745|5746|5799|5800|5846|5847|5848|',
            roomPartIds:                           '',
            actionType:                            '',
            weekNum:                               '36',
            date:                                  '09.09.2015',
            periodTime:                            '01:00',
            additionalAction:                      '',
            cmbProfile:                            '1018',
            action:                                'Hae',
            selMonth:                              '09',
            selYear:                               '2015',
            wednesdaySelected:                     'on',
            startTime:                             '06:30',
            endTime:                               '22:30',
            textTaskSubject:                       '',
            textTaskInfo:                          '',
            taskBookingClassification:             '0',
            taskMemoClassification:                '0',
            taskOrderDepartment:                   '0',
            taskDate:                              '',
            taskStartTime:                         '',
            taskEndTime:                           '',
            taskDueDate:                           ''
        }
    }).map('.body').map(function (markup) {
        return markup.match(/getCreateBooking.do[^,"']+/g).map(function (el) {
            return url.parse(el, true).query
        }).map(function(obj) {
            var startDateTime = obj.startTime.split(' ')
            var endDateTime = obj['amp;endTime'].split(' ')
            return {
                duration: 1,
                time:     startDateTime[1],
                date:     startDateTime[0],
                res:      obj['amp;roomPartId']
            }
        })
    })
}
