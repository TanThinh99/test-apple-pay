// document.addEventListener('DOMContentLoaded', function () {
//   if (window.ApplePaySession && ApplePaySession.canMakePayments()) {
//     const applePayButton = document.createElement('button');
//     applePayButton.id = 'apple-pay-button';
//     applePayButton.innerText = 'Pay with Apple Pay';
//     applePayButton.style = 'display: inline-block; background-color: black; color: white; padding: 10px; border-radius: 5px; cursor: pointer;';
//     document.getElementById('apple-pay-button').appendChild(applePayButton);

//     applePayButton.addEventListener('click', onApplePayButtonClicked);
//   }
// });

// function onApplePayButtonClicked() {
//   const paymentRequest = {
//     countryCode: 'US',
//     currencyCode: 'USD',
//     total: {
//       label: 'Your Merchant Name',
//       amount: '10.00'
//     },
//     supportedNetworks: ['amex', 'discover', 'masterCard', 'visa'],
//     merchantCapabilities: ['supports3DS']
//   };

//   const session = new ApplePaySession(3, paymentRequest);

//   session.onvalidatemerchant = function (event) {
//     const validationURL = event.validationURL;
//     validateMerchant(validationURL).then(function (merchantSession) {
//       session.completeMerchantValidation(merchantSession);
//     });
//   };

//   session.onpaymentauthorized = function (event) {
//     const payment = event.payment;
//     processPayment(payment).then(function (success) {
//       if (success) {
//         session.completePayment(ApplePaySession.STATUS_SUCCESS);
//       } else {
//         session.completePayment(ApplePaySession.STATUS_FAILURE);
//       }
//     });
//   };

//   session.begin();
// }

// function validateMerchant(validationURL) {
//   return fetch('/validate-merchant', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json'
//     },
//     body: JSON.stringify({ validationURL: validationURL })
//   }).then(response => response.json());
// }

// function processPayment(payment) {
//   return fetch('/process-payment', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json'
//     },
//     body: JSON.stringify({ payment: payment })
//   }).then(response => response.json()).then(data => {
//     return data.success;
//   });
// }


async function onApplePayButtonClicked() {

	// Consider falling back to Apple Pay JS if Payment Request is not available.
	if (!PaymentRequest) {
		return;
	}

	try {

		// Define PaymentMethodData
		const paymentMethodData = [{
			"supportedMethods": "https://apple.com/apple-pay",
			"data": {
				"version": 3,
				"merchantIdentifier": "merchant.com.apdemo",
				"merchantCapabilities": [
					"supports3DS"
				],
				"supportedNetworks": [
					"amex",
					"discover",
					"masterCard",
					"visa"
				],
				"countryCode": "US"
			}
		}];
		// Define PaymentDetails
		const paymentDetails = {
			"total": {
				"label": "Demo (Card is not charged)",
				"amount": {
					"value": "27.50",
					"currency": "USD"
				}
			}
		};
		// Define PaymentOptions
		const paymentOptions = {
			"requestPayerName": false,
			"requestBillingAddress": false,
			"requestPayerEmail": false,
			"requestPayerPhone": false,
			"requestShipping": false,
			"shippingType": "shipping"
		};

		// Create PaymentRequest
		const request = new PaymentRequest(paymentMethodData, paymentDetails, paymentOptions);

		request.onmerchantvalidation = event => {
			// Call your own server to request a new merchant session.
			const merchantSessionPromise = validateMerchant();
			event.complete(merchantSessionPromise);
		};

		request.onpaymentmethodchange = event => {
			if (event.methodDetails.type !== undefined) {
				// Define PaymentDetailsUpdate based on the selected payment method.
				// No updates or errors needed, pass an object with the same total.
				const paymentDetailsUpdate = {
					'total': paymentDetails.total
				};
				event.updateWith(paymentDetailsUpdate);
			} else if (event.methodDetails.couponCode !== undefined) {
				// Define PaymentDetailsUpdate based on the coupon code.
				const total = calculateTotal(event.methodDetails.couponCode);
				const displayItems = calculateDisplayItem(event.methodDetails.couponCode);
				const shippingOptions = calculateShippingOptions(event.methodDetails.couponCode);
				const error = calculateError(event.methodDetails.couponCode);

				event.updateWith({
					total: total,
					displayItems: displayItems,
					shippingOptions: shippingOptions,
					modifiers: [
						{
							data: {
								additionalShippingMethods: shippingOptions,
							},
						},
					],
					error: error,
				});
			}
		};

		request.onshippingoptionchange = event => {
			// Define PaymentDetailsUpdate based on the selected shipping option.
			// No updates or errors needed, pass an object with the same total.
			const paymentDetailsUpdate = {
				'total': paymentDetails.total
			};
			event.updateWith(paymentDetailsUpdate);
		};

		request.onshippingaddresschange = event => {
			// Define PaymentDetailsUpdate based on a shipping address change.
			const paymentDetailsUpdate = {};
			event.updateWith(paymentDetailsUpdate);
		};

		const response = await request.show();
		const status = "success";
		await response.complete(status);
	} catch (e) {
		// Handle errors
	}
}