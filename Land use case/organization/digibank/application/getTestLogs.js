/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
*/

/*
 * This application has 6 basic steps:
 * 1. Select an identity from a wallet
 * 2. Connect to network gateway
 * 3. Access PaperNet network
 * 4. Construct request to buy (buy_request) commercial paper
 * 5. Submit transaction
 * 6. Process response
 */

'use strict';

// Bring key classes into scope, most importantly Fabric SDK network class
const fs = require('fs');
const yaml = require('js-yaml');
const { Wallets, Gateway } = require('fabric-network');
const Property = require('../../digibank/contract/lib/property.js');

const listPendingForSaleListener = (event) => {
  console.log("Property with ID: "+event.propertyID+" is pending to be listed for sale.");
}
const listForSaleListener = (event) => {
  console.log("Property with ID: "+event.propertyID+" has been listed for sale.");
}
const updateOwnerListener = (event) => {
  console.log("The owner for property with Property ID: "+event.propertyID+" has been changed to "+event.newOwner);
}

const initiatedListener = (event) => {
  console.log("Offer Request with ID: "+event.requestID+" for property with ID: "+event.propertyID+" has been initiated by "+event.buyer);
}
const offerAcceptedListener = (event) => {
  console.log("Offer Request with ID: "+event.requestID+" for property with ID: "+event.propertyID+" has been accepted by seller");
}
const offerFinalizedListener = (event) => {
  console.log("Offer Request with ID: "+event.requestID+" for property with ID: "+event.propertyID+" has been finalized by buyer");
}
const makePaymentListener = (event) => {
  console.log("Payment corresponding to offer request with ID: "+event.requestID+" for property with ID: "+event.propertyID+" has been done");
}
const completeListener = (event) => {
  console.log("offer request with ID: "+event.requestID+" for property with ID: "+event.propertyID+" was successful and has been marked completed");
}
const rejectListener = (event) => {
  console.log("Offer request with ID: "+event.requestID+" for property with ID: "+event.propertyID+" has been rejected");
}

const eventListener = (event) => {
  const eventName=event.eventName;
  let payload=event.payload.toString();
  payload=JSON.parse(payload);
  if(eventName==='listPendingForSaleEvent') listPendingForSaleListener(payload);
  else if(eventName==='listForSaleEvent') listForSaleListener(payload);
  else if(eventName==='updateOwnerEvent') updateOwnerListener(payload);
  else if(eventName==='initiateEvent') initiatedListener(payload);
  else if(eventName==='AcceptedBySellerEvent') offerAcceptedListener(payload);
  else if(eventName==='FinalizedByBuyerEvent') offerFinalizedListener(payload);
  else if(eventName==='PaymentDoneEvent') makePaymentListener(payload);
  else if(eventName==='CompleteEvent') completeListener(payload);
  else if(eventName==='RejectEvent') rejectListener(payload);
  return;
}

async function main () {

    // A wallet stores a collection of identities for use
    const wallet = await Wallets.newFileSystemWallet('../identity/user/manager/wallet');


    // A gateway defines the peers used to access Fabric networks
    const gateway = new Gateway();

    // Main try/catch block
    try {

        // Specify userName for network access
        const userName = 'manager';

        // Load connection profile; will be used to locate a gateway
        let connectionProfile = yaml.safeLoad(fs.readFileSync('../gateway/connection-org1.yaml', 'utf8'));

        // Set connection options; identity and wallet
        let connectionOptions = {
            identity: userName,
            wallet: wallet,
            discovery: { enabled: true, asLocalhost: true }

        };

        // Connect to gateway using application specified parameters
        console.log('Connect to Fabric gateway.');

        await gateway.connect(connectionProfile, connectionOptions);

        // Access PaperNet network
        console.log('Use network channel: mychannel.');

        const network = await gateway.getNetwork('mychannel');

        // Get addressability to commercial paper contract
        console.log('Use property smart contract.');

        const propertyContract = await network.getContract('propertycontract', 'org.land-reg.property');
        const propertyRequestContract = await network.getContract('propertycontract', 'org.land-reg.property');

        propertyContract.addContractListener(eventListener);
        // propertyRequestContract.addContractListener(eventListener);
    } catch (error) {

        console.log(`Error processing transaction. ${error}`);
        console.log(error.stack);

    } finally {

        // Disconnect from the gateway
        // console.log('Disconnect from Fabric gateway.');
        gateway.disconnect();

    }
}

main();
