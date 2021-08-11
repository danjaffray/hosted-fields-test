
document.addEventListener("DOMContentLoaded", async function(){
    console.log("Starting payment")
    await startPayment();
});


    // use ngrok to tunnel into a publicly accessable website (not needed if hosting yourself)
    const ngrok = "https://c874e34d3672.ngrok.io"

    // Get Access Token
    const getAccessToken = async () => {
        const response = await fetch ("api/accessToken")
        const json = await response.json()
        return json
    }

    // Create function to start the payment process
    const startPayment = async() => {

        let accessToken = await getAccessToken()
        console.log(accessToken)
        
    // Configure account
    GlobalPayments.configure({
        accessToken: accessToken.config.token,
        env: accessToken.environment // "sandbox" or "production" 
    });       
    
    // Create Form
    const cardForm = GlobalPayments.creditCard.form("#credit-card", { style: "gp-default" });

    cardForm.ready(async () => {
        
        cardForm.addStylesheet({
            '@import url("https://fonts.googleapis.com/css2?family=Roboto:wght@100;300;400;500;700;900&display=swap")': {},

            'form#payment-form': {},

            'h2': {
                'font-family': "'Roboto', sans-serif"
            },

            '#input[type=text]': {
                'width': '100%',
                'padding': '12px 20px',
                'margin': '8px 0',
                'box-sizing': 'border-box',

            },

            '#payment-form label': {
                'font-family': "'Roboto', sans-serif",
                'font-weight': '500',
                'display': 'block',
                'margin-bottom': '7px',
                'color': '#474B57'
            },

            '.secure-payment-form .credit-card-shield .secure-payment-form .credit-card-logo': {
                'height': '35px',
                'background-size': 'auto 100%'
            },

            '.secure-payment-form .credit-card-card-cvv iframe': {
                'width': 'calc(100% - 30px)'
            },

            '.secure-payment-form .tooltip': {
                'width': '30px'
            },

            '@media(min-width:800px)': {
                '.secure-payment-form .credit-card-card-expiration.secure-payment-form .credit-card-card-cvv': {
                    'width': '40%'
                }
            }
        });
    })
    
    cardForm.on("token-success", async (resp) => { // need to make this function async to allow the helper library to use await

    console.log("Response", resp)

    // Start 3DSecure process

        const {
            checkVersion,
            getBrowserData,
            initiateAuthentication,
            AuthenticationSource,
            AuthenticationRequestType,
            MessageCategory,
            ChallengeRequestIndicator,
            ChallengeWindowSize,
        } = GlobalPayments.ThreeDSecure;

    console.log("Method Notifcation URL", ngrok + '/3ds2/methodNotificationUrl')
    console.log("Challenge Notifcation URL",ngrok + '/3ds2/challengeNotificationUrl')

        try {
            const versionCheckData = await checkVersion('/3ds2/check3dsVersion', {
                methodNotificationUrl: ngrok + '/3ds2/methodNotificationUrl', // using ngrok + route for methodNotificationUrl
                challengeNotificationUrl: ngrok + '/3ds2/challengeNotificationUrl',
                paymentToken: resp.paymentReference,
            });

    console.log("Version Check Data", versionCheckData)

            const authenticateData = await initiateAuthentication('/3ds2/initiateAuthentication', {
                merchantContactUrl: 'http://example.com/contact',
                challengeNotificationUrl: ngrok + '/3ds2/challengeNotificationUrl',
                challengeWindow: {
                    windowSize: ChallengeWindowSize.Windowed600x400,
                    displayMode: 'lightbox',
                },
                authenticationRequestType: AuthenticationRequestType.PaymentTransaction,
                serverTransactionId: versionCheckData.serverTransactionId,
                methodUrlComplete: true,
                paymentToken: resp.paymentReference,
                id: versionCheckData.id
            });

    console.log("Authentication Data", authenticateData)

    // add payment token to form as a hidden input
    const token = document.createElement("input");
    token.type = "hidden";
    token.name = "payment_token";
    token.value = resp.paymentReference;

    const authentication = document.createElement("input");
    authentication.type = "hidden";
    authentication.name = "auth_id";
    authentication.value = versionCheckData.id;

// Submit data to the integration's backend for processing
    const form = document.getElementById("payment-form");
    form.appendChild(token);
    form.appendChild(authentication);
    form.submit();

        } catch (e) {
        console.error('An error occurred', e.reasons);
        console.log(e)
        return;
    }     

    });
    
    cardForm.on("token-error", (resp) => {
        // show error to the consumer
    });
}

