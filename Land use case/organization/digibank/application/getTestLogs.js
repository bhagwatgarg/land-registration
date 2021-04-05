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

const eventListener = (event) => {
  const eventName=event.eventName;
  let payload=event.payload.toString();
  payload=JSON.parse(payload);
  if(eventName==='listPendingForSaleEvent') listPendingForSaleListener(payload);
  else if(eventName==='listForSaleEvent') listForSaleListener(payload);
  else if(eventName==='updateOwnerEvent') updateOwnerListener(payload);
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
        console.log('Use org.papernet.commercialpaper smart contract.');

        const contract = await network.getContract('propertycontract', 'org.land-reg.property');

        contract.addContractListener(eventListener);
    } catch (error) {

        console.log(`Error processing transaction. ${error}`);
        console.log(error.stack);

    } finally {

        // Disconnect from the gateway
        console.log('Disconnect from Fabric gateway.');
        gateway.disconnect();

    }
}

main();