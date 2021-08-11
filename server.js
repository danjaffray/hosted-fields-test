
// Add a bunch of packages that you need
const express = require('express');
const fetch = require("node-fetch");
const app = express();
var sha512 = require('js-sha512');
const { response } = require('express');

// Anything in the "globalpayments" folder will be served as static content in localhost
app.use(express.static('globalpayments')); 
app.use(express.json()); // adds a built-in JSON parser to Express
app.use(express.urlencoded({
    extended: true
}));

app.listen(8080, () =>{
    console.log("Running on port 8080");
})

// GP API details
// Configure .env file
require('dotenv').config()

let gpApiVersion = process.env.GP_API_VERSION
let app_id = process.env.GP_API_APP_ID
let app_key = process.env.GP_API_APP_KEY

let nonce = new Date().toISOString();

// API requests to GP API
const createSecret = (app_key, nonce) => {
    
    let secretKey = sha512(nonce + app_key)
    return secretKey

}

const getAccessToken = async() => {

    let headers ={
        "X-GP-Version": gpApiVersion,
        "Content-Type": "application/json"
    }

    let body = {
        "app_id":app_id,
        "secret": createSecret(app_key, nonce),
        "grant_type": "client_credentials",
        "nonce":nonce
    }

    let options = {
        method:"POST",
        body: JSON.stringify(body),
        headers:headers

    }

    const response = await fetch(`${process.env.GP_API_ENVIRONMENT}/ucp/accesstoken`, options);
    const json = await response.json()

    return json
}

const doCharge = async(paymentToken) => {

    
    console.log("Payment Token", paymentToken)

    let accessToken = await getAccessToken()

    let headers ={
        "X-GP-Version": gpApiVersion,
        "Content-Type": "application/json",
        "Accept" : "application/json",
        "Authorization" : "Bearer " + accessToken.token
    }

    console.log(accessToken)

    let body = {

        "account_name": accessToken.scope.accounts[0].name,
        "type": "SALE",
        "channel": "CNP",
        "capture_mode": "AUTO",
        "amount": "1999",
        "currency": "GBP",
        "reference": "93459c78-f3f9-427c-84df-ca0584bb55bf",
        "country": "US",
        "ip_address": "123.123.123.123",
        "payment_method": {
          "id": paymentToken,
          "name": "James Mason",
          "entry_mode": "ECOM",
          "authentication": {
            "three_ds": {
              "server_trans_ref": "vJ9NXpFueXsAqeb4iAbJJbe+66s=",
              "value": "AAACBUGDZYYYIgGFGYNlAAAAAAA=",
              "eci": "5",
              "message_version": "1.0.0"
            }
          }
        }
    }

    let options = {
        method:"POST",
        body: JSON.stringify(body),
        headers:headers

    }

    const response = await fetch(`${process.env.GP_API_ENVIRONMENT}/ucp/transactions`, options);
    const json = await response.json()

    return json
}

const check3dsVersion = async(data) => {

    let accessToken = await getAccessToken()

    let headers ={
        "X-GP-Version": gpApiVersion,
        "Content-Type": "application/json",
        "Accept" : "application/json",
        "Authorization" : "Bearer " + accessToken.token
    }

    
    let body = {
        
            "account_name": accessToken.scope.accounts[0].name,
            "channel": "CNP",
            "currency": "GBP",
            "reference": "My Own Reference",
            "country": "GB",
            "amount": "1999",
            "three_ds":{
                "source": "BROWSER"
            },
            "payment_method": {
                "id": data.paymentToken
            },
            "notifications": {
                "challenge_return_url": data.challenge_return_url,
                "three_ds_method_return_url": data.three_ds_method_return_url
            }
    }

    let options = {
        method:"POST",
        body: JSON.stringify(body),
        headers:headers

    }

    const response = await fetch(`${process.env.GP_API_ENVIRONMENT}/ucp/authentications`, options);
    const json = await response.json()

    return json

}

const initiate3dsecure = async (data) => {

    let id = data.id

    let accessToken = await getAccessToken()

    let headers ={
        "X-GP-Version": gpApiVersion,
        "Content-Type": "application/json",
        "Accept" : "application/json",
        "Authorization" : "Bearer " + accessToken.token
    }


    let body = {
        "account_name": accessToken.scope.accounts[0].name,
        "channel": "CNP",
        "amount": "1999",
        "currency": "GBP",
        "country": "GB",
        "preference": "CHALLENGE_MANDATED",
        "three_ds":{
            "source": "BROWSER"
        },
        "method_url_completion_status": "YES",
        "payment_method": {
          "id": data.paymentToken
        },
        "order": {
          "time_created_reference": "2019-04-26T10:19:32.552327Z",
          "amount": "1001",
          "currency": "GBP",
          "reference": "3400dd37-101d-4940-be15-3c963b6109b3",
          "address_match_indicator": "false",
          "shipping_address": {
            "line1": "Apartment 852",
            "line2": "Complex 741",
            "line3": "House 963",
            "city": "Chicago",
            "postal_code": "50001",
            "state": "IL",
            "country": "840"
          },
          "gift_card_count": "01",
          "gift_card_currency": "EUR",
          "gift_card_amount": "25000",
          "delivery_email": "james.mason@example.com",
          "delivery_timeframe": "ELECTRONIC_DELIVERY",
          "shipping_method": "ANOTHER_VERIFIED_ADDRESS",
          "shipping_name_matches_cardholder_name": "true",
          "preorder_indicator": "MERCHANDISE_AVAILABLE",
          "preorder_availability_date:": "2019-04-18",
          "reorder_indicator": "FIRST_TIME_ORDER",
          "transaction_type": "GOODS_SERVICE_PURCHASE"
        },
        "payer": {
          "reference": "6dcb24f5-74a0-4da3-98da-4f0aa0e88db3",
          "account_age": "LESS_THAN_THIRTY_DAYS",
          "account_creation_date": "2019-01-10",
          "account_change_date": "2019-01-28",
          "account_change_indicator": "THIS_TRANSACTION",
          "account_password_change_date": "2019-01-15",
          "account_password_change_indicator": "LESS_THAN_THIRTY_DAYS",
          "home_phone": {
            "country_code": "44",
            "subscriber_number": "123456789"
          },
          "work_phone": {
            "country_code": "44",
            "subscriber_number": "1801555888"
          },
          "payment_account_creation_date": "2019-01-01",
          "payment_account_age_indicator": "LESS_THAN_THIRTY_DAYS",
          "suspicious_account_activity": "NO_SUSPICIOUS_ACTIVITY",
          "purchases_last_6months_count": "03",
          "transactions_last_24hours_count": "01",
          "transaction_last_year_count": "05",
          "provision_attempt_last_24hours_count": "01",
          "shipping_address_time_created_reference": "2019-01-28",
          "shipping_address_creation_indicator": "THIS_TRANSACTION"
        },
        "payer_prior_three_ds_authentication_data": {
          "authentication_method": "FRICTIONLESS_AUTHENTICATION",
          "acs_transaction_reference": "26c3f619-39a4-4040-bf1f-6fd433e6d615",
          "authentication_timestamp": "2020-07-28T10:26:49.712Z",
          "authentication_data": "secret123"
        },
        "recurring_authorization_data": {
          "max_number_of_instalments": "05",
          "frequency": "25",
          "expiry_date": "2019-08-25"
        },
        "payer_login_data": {
          "authentication_data": "secret123",
          "authentication_timestamp": "2020-07-28T10:26:49.712Z",
          "authentication_type": "MERCHANT_SYSTEM_AUTHENTICATION"
        },
        "browser_data": {
          "accept_header": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
          "color_depth": "TWENTY_FOUR_BITS",
          "ip": "123.123.123.123",
          "java_enabled": "true",
          "javascript_enabled": "true",
          "language": "en-US",
          "screen_height": "1080",
          "screen_width": "1920",
          "challenge_window_size": "FULL_SCREEN",
          "timezone": "0",
          "user_agent": "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36"
        },
        "merchant_contact_url": "https://enp4qhvjseljg.x.pipedream.net/"
      }

    let options = {
        method:"POST",
        body: JSON.stringify(body),
        headers:headers

    }

    console.log(body)
   
    const response = await fetch(`${process.env.GP_API_ENVIRONMENT}/ucp/authentications/${id}/initiate`, options);
    const json = await response.json()

    return json


}

// Routes for application requests
app.get('/api/accessToken', async (request, response) => {

    // define a function to get Access Token
    let accessToken = await getAccessToken()

    // pull environment from config file
    let environment = process.env.GP_API_CLIENTSIDE_ENVIRONMENT
    console.log(environment)

    // Return object to client side 
    response.send({
        "config": accessToken,
        "environment": environment
    })

})

app.all('/3ds2/challengeNotificationUrl', async (request, response) => {

    console.log("*********************************** /api/3DSecure/challengeNotificationUrl API REQUEST ");      
    console.log("challengeNotifcationURL", request.body);

    const data = request.body

    try {
    // decode base64 response from ACS
    let buff = Buffer.from(data.cres, 'base64')
    let string = buff.toString('utf8')
    
    // Convert into JSON
    let stringJson = JSON.parse(string)

    // Pull out the individual elements
    let acsTransID = stringJson.acsTransID
    let transStatus = stringJson.transStatus
    let threeDSServerTransID = stringJson.threeDSServerTransID
    let messageType = stringJson.messageType
    let messageVersion = stringJson.messageVersion

    // Check if the challenge was successful
    if (transStatus == "Y"){

        // send a query string to the challenge URL to notify of a successful result
        console.log(stringJson)
        response.redirect("/challengeNotificationUrl.html?challengeSuccessful=true");
    }
    else{

        console.log(stringJson)
        response.redirect("/challengeNotificationUrl.html?challengeSuccessful=false");
    
    }
    } catch (error) {

        console.log(error)
        response.redirect("/challengeNotificationUrl.html?challengeSuccessful=false");
    }
})

app.post('/3ds2/methodNotificationUrl', async (request, response) => {

    console.log("*********************************** /api/3DSecure/methodNotificationUrl API REQUEST ");
    console.log("methodNotificationUrl", request.body);
    response.redirect("/methodNotificationUrl.html");

})

app.post('/3ds2/check3dsVersion', async (request, response) => {

    console.log("*********************************** /api/3DSecure/checkVersion API REQUEST ");

    const data = request.body;
    console.log(data)
    
    try {
        let checkVersionData = {
            "paymentToken": data.paymentToken,
            "challenge_return_url" : data.challengeNotificationUrl,
            "three_ds_method_return_url" : data.methodNotificationUrl
        }
    
        let checkVersionResponse = await check3dsVersion(checkVersionData)
    
        console.log("/api/3DSecure/checkVersion API RESPONSE");
    
        console.log(checkVersionResponse);
    
        let formattedResponse = await checkVersionFormatter(checkVersionResponse)
        response.send(formattedResponse);
        
    }
    catch (error) {
       response.send(error)
    }
})

app.post('/3ds2/initiateAuthentication', async (request, response) => {

console.log("*********************************** /api/3DSecure/initiate3DSecure API REQUEST ");

const data = request.body

console.log("Data", data)

try {
    let initiateAuthenticationData = {

        "authenticationRequestType":data.authenticationRequestType,
        "authenticationSource":data.authenticationSource,
        "browserData":data.browserData,
        "challengeNotificationUrl":data.challengeNotificationUrl,
        "challengeRequestIndicator":data.challengeRequestIndicator,
        "merchantContactUrl":data.merchantContactUrl,
        "messageCategory":data.messageCategory,
        "methodUrlComplete":data.methodUrlComplete,
        "serverTransactionId":data.serverTransactionId,
        "id":data.id,
        "paymentToken":data.paymentToken
    }
    
    let initiate3dsecureResponse = await initiate3dsecure(initiateAuthenticationData)
    
    console.log(initiate3dsecureResponse)
    
    let formattedResponse = await initiateAuthenticationFormatter(initiate3dsecureResponse)
    response.send(formattedResponse)
    
} catch (error) {
    response.send(error)
}

})

app.post('/api/charge', async (request, response) => {
    
    const data = request.body

    try {

    let charge = await doCharge(data.payment_token)
    response.send(charge)
        
    } 
    catch (error) {
        response.send(error)
    }    
})

// Formatters!
let checkVersionFormatter = async (jsonResponse) =>{

    let response = {

        "enrolled":jsonResponse.three_ds.enrolled_status,
        "methodData":jsonResponse.three_ds.method_data.encoded_method_data,
        "methodUrl":jsonResponse.three_ds.method_url,
        "serverTransactionId":jsonResponse.three_ds.server_trans_ref,
        "versions":{
            "accessControlServer":jsonResponse.three_ds.acs_protocol_version_start,
            "directoryServer":jsonResponse.three_ds.ds_protocol_version_start
        },
        "id":jsonResponse.id
    }
    return response;
}

let initiateAuthenticationFormatter = async (jsonResponse) =>{

    let response = {
        "acsTransactionId": jsonResponse.three_ds.acs_trans_ref,
        "authenticationSource": jsonResponse.three_ds.authentication_source,
        "authenticationRequestType": jsonResponse.three_ds.message_category,
        "cardholderResponseInfo": jsonResponse.three_ds.cardholder_response_info,
    
        "challenge": {
            "encodedChallengeRequest":jsonResponse.three_ds.challenge_value,
            "requestUrl":jsonResponse.three_ds.acs_challenge_request_url, // or redirect_url / acs_challenge_request_url
        },
        "challengeMandated": jsonResponse.three_ds.challenge_status,
        "deviceRenderOptions": jsonResponse.three_ds.authentication_source,
        "dsTransactionId": jsonResponse.ds_trans_ref,
        "messageCategory": jsonResponse.three_ds.liability_shift,
        "messageExtension": jsonResponse.three_ds.challenge_model,
        "messageVersion": jsonResponse.three_ds.message_version,
    
        "mpi": {
            "authenticationValue":jsonResponse.three_ds.authentication_value,
            "eci":jsonResponse.three_ds.eci,
        },
        "serverTransactionId": jsonResponse.three_ds.server_trans_ref,
        "status": jsonResponse.three_ds.status,
        "statusReason": jsonResponse.three_ds.status_reason,
        }

    return response
}