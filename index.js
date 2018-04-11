/* eslint-disable  func-names */
/* eslint quote-props: ["error", "consistent"]*/
/**
 * This sample demonstrates a simple skill built with the Amazon Alexa Skills
 * nodejs skill development kit.
 * This sample supports multiple lauguages. (en-US, en-GB, de-DE).
 * The Intent Schema, Custom Slots and Sample Utterances for this skill, as well
 * as testing instructions are located at https://github.com/alexa/skill-sample-nodejs-fact
 **/

'use strict';

const Alexa = require('alexa-sdk');

const APP_ID = undefined;  // TODO replace with your app ID (OPTIONAL).

const languageStrings = {
    'en': {
        translation: {
            FACTS: [
                'Hi, Welcome to HRDC. How can I help you ?',
                'May I know your visit key',
                'You have been successfully signed in. Please stand before the Ipad to take your picture',
                'Sorry, this is not a correct key. Try Again',
                'Please contact your administrator for a visit key'
            ],
            SKILL_NAME: '',
            GET_FACT_MESSAGE: "",
            HELP_MESSAGE: 'What can I help you with?',
            HELP_REPROMPT: 'What can I help you with?',
            STOP_MESSAGE: 'Goodbye!',
        },
    },
};

const handlers = {
    'LaunchRequest': function () {
        this.emit('GetFact');
    },
    'Welcome': function () {
        this.emit('GetFact');
    },
    'GetFact': function () {
        var self = this;

        //'Hi, Welcome to lenel. How can I help you ?',
        const factArr = self.t('FACTS');
        const factIndex = 0;
        const randomFact = factArr[factIndex];

        // Create speech output
        const speechOutput = self.t('GET_FACT_MESSAGE') + randomFact;
        self.emit(':ask', speechOutput, self.t('SKILL_NAME'), randomFact);
    },
    'Access': function () {
        //'May I know your visit key',
        const factArr = this.t('FACTS');
        const factIndex = 1;
        const randomFact = factArr[factIndex];

        // Create speech output
        const speechOutput = this.t('GET_FACT_MESSAGE') + randomFact;
        this.emit(':ask', speechOutput, this.t('SKILL_NAME'), randomFact);
    },
    'VisitKeyValid': function () {
        var VisitKey = this.event.request.intent.slots.visitkey.value;
        var VisitorDetails = "Prashanth Kosuru";
        let factIndex;
        var self = this;
        const factArr = this.t('FACTS');
        //Validate VisitKey
        // var VisitKey = 44069618;

        var request = require('request');
        var formData = {
            "user_name": "sa",
            "password": "sas"
        };
        var auth = {
            method: 'POST',
            rejectUnauthorized: false,
            url: 'https://ec2-52-59-250-81.eu-central-1.compute.amazonaws.com:8080/api/access/onguard/openaccess/authentication?version=1.0&queue=false',
            headers: {
                'Application-Id': 'OPEN_ACCESS_NON_PRODUCTION'
            },
            body: JSON.stringify({
                "user_name": "sa",
                "password": "sas"
            })
        };

        request(auth, function (err, httpResponse, body) {
            if (err) {
                return console.error('upload failed:', err);
            }
            var authResult = JSON.parse(body);
            //   console.log('Session Token', authResult.session_token);

            var visit = {
                method: 'GET',
                rejectUnauthorized: false,
                url: 'https://ec2-52-59-250-81.eu-central-1.compute.amazonaws.com:8080/api/access/onguard/openaccess/instances?type_name=lnl_visit&filter=VISIT_KEY=' + VisitKey + '&page_number=1&page_size=1&version=1.0&queue=false',
                headers: {
                    'Application-Id': 'OPEN_ACCESS_NON_PRODUCTION',
                    'Session-Token': authResult.session_token
                }
            };

            request(visit, function (err, httpResponse, body) {
                if (err) {
                    return console.error('upload failed:', err);
                }
                var visitResult = JSON.parse(body);
                console.log(visitResult);
                if (visitResult.count > 0) {


                    var visitDetails = visitResult.item_list[0].property_value_map;
                    //   console.log('Visit Details', visitDetails);

                    var signIn = {
                        method: 'POST',
                        rejectUnauthorized: false,
                        url: 'https://ec2-52-59-250-81.eu-central-1.compute.amazonaws.com:8080/api/access/onguard/openaccess/execute_method?type_name=lnl_visit&method_name=SignVisitIn&version=1.0&queue=false',
                        headers: {
                            'Application-Id': 'OPEN_ACCESS_NON_PRODUCTION',
                            'Session-Token': authResult.session_token
                        },
                        body: JSON.stringify({
                            "property_value_map": { "ID": visitDetails.ID },
                            "in_parameter_value_map": {}
                        })
                    };

                    request(signIn, function (err, httpResponse, body) {
                        if (err) {
                            return console.error('upload failed:', err);
                        }
                        var signInResult = JSON.parse(body);
                        //   console.log('SignIn Details', signInResult);

                        var getVisitorDetails = {
                            method: 'GET',
                            rejectUnauthorized: false,
                            url: 'https://ec2-52-59-250-81.eu-central-1.compute.amazonaws.com:8080/api/access/onguard/openaccess/instances?type_name=lnl_visitor&filter=ID=' + visitDetails.VISITORID + '&page_number=1&page_size=1&version=1.0&queue=false',
                            headers: {
                                'Application-Id': 'OPEN_ACCESS_NON_PRODUCTION',
                                'Session-Token': authResult.session_token
                            }
                        };

                        request(getVisitorDetails, function (err, httpResponse, body) {
                            if (err) {
                                return console.error('upload failed:', err);
                            }
                            var visitorResult = JSON.parse(body);
                            VisitorDetails = visitorResult.item_list[0].property_value_map;
                            console.log('Visitor Details', VisitorDetails);


                            //Push Notification
                            var AWS = require('aws-sdk');
                            AWS.config.update({
                                accessKeyId: 'AKIAIKVEZJWCXBIRI6RQ',
                                secretAccessKey: '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',
                                region: 'us-east-1'
                            });
                            var sns = new AWS.SNS();
                            var endpointArn = "arn:aws:sns:us-east-1:465868791072:endpoint/APNS_SANDBOX/VSS/0c9bd143-87a8-3009-9970-36075ccfca60";
                            var payload = {

                                default: JSON.stringify(VisitorDetails),
                                APNS: {
                                    aps: {
                                        alert: VisitorDetails,
                                        sound: 'default',
                                        badge: 1
                                    }
                                }
                            };

                            payload.APNS = JSON.stringify(payload.APNS);
                            payload = JSON.stringify(payload);

                            console.log('sending push');
                            sns.publish({
                                Message: payload,
                                MessageStructure: 'json',
                                TargetArn: endpointArn
                            }, function (err, data) {
                                if (err) {
                                    console.log(err.stack);
                                    return;
                                }

                                console.log('push sent');
                                console.log(data);

                                //'Thank you, let me validate. Please Collect your badge',
                                factIndex = 2;
                                const randomFact = factArr[factIndex];
                                const speechOutput = self.t('GET_FACT_MESSAGE') + randomFact;
                                self.emit(':tellWithCard', speechOutput, self.t('SKILL_NAME'), randomFact);
                            });
                        });

                    });
                }

                else {
                    //'Thank you, let me validate. Sorry, this is not a correct key. Try Again',
                    factIndex = 3;
                    const randomFact = factArr[factIndex];
                    const speechOutput = self.t('GET_FACT_MESSAGE') + randomFact;
                    self.emit(':ask', speechOutput, self.t('SKILL_NAME'), randomFact);
                }
            });

        });

    },

    'NoKey': function () {
        //'Please contact your administrator for a visit key'
        const factArr = this.t('FACTS');
        const factIndex = 4;
        const randomFact = factArr[factIndex];

        // Create speech output
        const speechOutput = this.t('GET_FACT_MESSAGE') + randomFact;
        this.emit(':tellWithCard', speechOutput, this.t('SKILL_NAME'), randomFact);
    },


    'AMAZON.HelpIntent': function () {
        const speechOutput = this.t('HELP_MESSAGE');
        const reprompt = this.t('HELP_MESSAGE');
        this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
};

exports.handler = function (event, context) {
    const alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    // To enable string internationalization (i18n) features, set a resources object.
    alexa.resources = languageStrings;
    alexa.registerHandlers(handlers);
    alexa.execute();
};
