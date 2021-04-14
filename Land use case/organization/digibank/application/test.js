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
const PropertyRequest = require('../../digibank/contract/lib/propertyrequest');

const transactions = async (propertyContract, propertyRequestContract) => {

  console.log("Issuing a property");
  const issueRes=await propertyContract.submitTransaction('issue', '1', 'OW1', 'ADD1');
  let property=Property.fromBuffer(issueRes);
  // console.log(property);

  console.log("Updating its status to Listing-Pending");
  let listPending = await propertyContract.submitTransaction('listPendingForSale', '1', 'OW1');
  property=Property.fromBuffer(listPending);
  // console.log(property);

  console.log("Updating its status to Listed");
  const list = await propertyContract.submitTransaction('listForSale', '1', 'OW1');
  property=Property.fromBuffer(list);
  // console.log(property);
  
  //let list2=await contract.submitTransaction('getList');
  //console.log(JSON.parse(list2.toString()).map((res)=>{
    //  res=res.Record;
    //  let res2={
      //    address: res.address,
      //    owner: res.owner,
      //    propertyID: res.propertyID,
     // };
    //  return res2;
 // }));

  console.log("Issuing Request for 2500");
  let res=await propertyRequestContract.submitTransaction('issue', '1', 'r1', 'buy1', '2500');
  let propertyRequest=PropertyRequest.fromBuffer(res);
  console.log(propertyRequest);

  console.log("Accept Offer");
  res=await propertyRequestContract.submitTransaction('AcceptOffer', 'r1','buy1');
  propertyRequest=PropertyRequest.fromBuffer(res);
  console.log(propertyRequest);

  console.log("Buyer Finalizes");
  res=await propertyRequestContract.submitTransaction('FinalizeProperty', 'r1','buy1');
  propertyRequest=PropertyRequest.fromBuffer(res);
  console.log(propertyRequest);

  console.log("Payment Done");
  res=await propertyRequestContract.submitTransaction('MakePayment', 'r1','buy1');
  propertyRequest=PropertyRequest.fromBuffer(res);
  console.log(propertyRequest);

  console.log("Request Completed");
  res=await propertyRequestContract.submitTransaction('Complete', 'r1','buy1');
  propertyRequest=PropertyRequest.fromBuffer(res);
  console.log(propertyRequest);

  // console.log("Buyer Finalizes");
  // res=await propertyRequestContract.submitTransaction('FinalizeProperty', 'r1','buy1');
  // propertyRequest=PropertyRequest.fromBuffer(res);
  // console.log(propertyRequest);

//   try{
//       listPending = await contract.submitTransaction('listPendingForSale', '1', 'OW1');
//       property=Property.fromBuffer(listPending);
//   } catch(e){
//       console.log("**********ERROR**********");
//       console.log(e.responses[0].response.message.split(':').splice(2).join(':'));
//       console.log("*************************");
//   }

  console.log("Updating its ownership");
  const newOwn = await propertyContract.submitTransaction('updateOwner', '1', 'buy1');
  property=Property.fromBuffer(newOwn);
  console.log(property);
}


// Main program function
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

        const propertyContract = await network.getContract('propertycontract', 'org.land-reg.property');
        const propertyRequestContract = await network.getContract('propertycontract', 'org.land-reg.propertyrequest');


        await transactions(propertyContract, propertyRequestContract);

        // // request to buy commercial paper using buy_request / transfer two-part transaction
        // console.log('Submit commercial paper buy_request transaction.');

        console.log('Transaction complete.');

    } catch (error) {

        console.log(`Error processing transaction. ${error}`);
        console.log(error.stack);

    } finally {

        // Disconnect from the gateway
        console.log('Disconnect from Fabric gateway.');
        gateway.disconnect();

    }
}
main().then(() => {

    console.log('Buy_request program complete.');

}).catch((e) => {

    console.log('Buy_request program exception.');
    console.log(e);
    console.log(e.stack);
    process.exit(-1);

});
