/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
*/

'use strict';

// Fabric smart contract classes
const { Contract, Context } = require('fabric-contract-api');

// PaperNet specifc classes
const Property = require('./property.js');
const PropertyList = require('./propertylist.js');
const QueryUtils = require('./queries.js');

/**
 * A custom context provides easy access to list of all properties
 */
class PropertyContext extends Context {

    constructor() {
        super();
        // All papers are held in a list of papers
        this.propertyList = new PropertyList(this);
    }

}

/**
 * Define property smart contract by extending Fabric Contract class
 *
 */
class PropertyContract extends Contract {

    constructor() {
        // Unique namespace when multiple contracts (property and property-request) per chaincode file
        super(Property.getClass());
    }

    /**
     * Define a custom context for property
    */
    createContext() {
        return new PropertyContext();
    }

    /**
     * Instantiate to perform any setup of the ledger that might be required.
     * @param {Context} ctx the transaction context
     */
    async instantiate(ctx) {
        // No implementation required with this example
        // It could be where data migration is performed, if necessary
        console.log('Instantiate the contract');
    }

    /**
     * Issue property (without any validations)
     *
     * @param {Context} ctx the transaction context
     * @param {String} propertyID unique property ID
     * @param {String} owner property owner
     * @param {String} address property address
    */
    async issue(ctx, propertyID, owner, address) {

        // create new property instance
        let property = Property.createInstance(propertyID, owner, address);

        // set its status and mspid
        property.setNotListed();

        let mspid = ctx.clientIdentity.getMSPID();
        property.setOwnerMSP(mspid);

        // add the property to the ledger
        await ctx.propertyList.addProperty(property);

        return property;
    }

    //1A
    /**
     * Set the property status to 'Listing Pending'
     * @param {Context} ctx the transaction context
     * @param {String} propertyID unique property ID
     * @param {String} owner property owner
     */
    async listPendingForSale(ctx, propertyID, owner) {

        // get property from key
        let propertyKey = Property.makeKey([propertyID]);
        let property = await ctx.propertyList.getProperty(propertyKey);

        // validate the current status and owner
        if(property.getOwner() !== owner){
            throw new Error('Wrong Owner.');
        }
        if(property.isListed()) {
            throw new Error('Already Listed!');
        }
        if(property.isListingPending()) {
            throw new Error('Already Listing Pending!');
        }

        property.setListingPending();

        // upload the changes to the ledger
        await ctx.propertyList.updateProperty(property);

        // emit an event regarding transaction completion
        ctx.stub.setEvent('listPendingForSaleEvent', Buffer.from(JSON.stringify({propertyID, owner})));
        return property;
    }

    // 1B
    /**
     * Set the porperty status to 'Listed'
     * @param {Context} ctx the transaction context
     * @param {String} propertyID unique property ID
     * @param {String} owner property owner
     */
    async listForSale(ctx, propertyID, owner) {

        // get property from key
        let propertyKey = Property.makeKey([propertyID]);
        let property = await ctx.propertyList.getProperty(propertyKey);

        // validate the owner and status of the property
        if(property.getOwner() !== owner){
            throw new Error('Wrong Owner.');
        }
        if(property.isListed()) {
            throw new Error('Already Listed!');
        }
        if(property.isNotListed()){
            throw new Error('Set Listed Pending First');
        }

        // update the property and push it to the ledger
        property.setListed();
        await ctx.propertyList.updateProperty(property);

        // emit an event regarding transaction completion
        ctx.stub.setEvent('listForSaleEvent', Buffer.from(JSON.stringify({propertyID, owner})));
        return property;
    }

    // 3c
    /**
     * Update property ownership
     * @param {COntext} ctx the transaction context
     * @param {String} propertyID unique property ID
     * @param {String} newOwner the buyer
     */
     async getList(ctx) {
       let querySelector = {};
               querySelector = { "selector": { "currentState": 3 } };  // 4 = redeemd state
        let query = new QueryUtils(ctx, 'org.land-reg.propertyList');
        let adhoc_results = await query.queryByAdhoc(querySelector);

       return adhoc_results;
    }

    async updateOwner(ctx, propertyID, newOwner) {

        // get property from key
        let propertyKey = Property.makeKey([propertyID]);
        let property = await ctx.propertyList.getProperty(propertyKey);

        // validate the current status
        if(!property.isListed()) {
            throw new Error('Property Not Listed');
        }

        // update the property and push it to the ledger
        property.setOwner(newOwner);
        property.setNotListed();
        await ctx.propertyList.updateProperty(property);

        // emit an event regarding transaction completion
        ctx.stub.setEvent('updateOwnerEvent', Buffer.from(JSON.stringify({propertyID, newOwner})));
        return property;
    }

//     /**
//      * Buy commercial paper
//      *
//       * @param {Context} ctx the transaction context
//       * @param {String} issuer commercial paper issuer
//       * @param {Integer} paperNumber paper number for this issuer
//       * @param {String} currentOwner current owner of paper
//       * @param {String} newOwner new owner of paper
//       * @param {Integer} price price paid for this paper // transaction input - not written to asset
//       * @param {String} purchaseDateTime time paper was purchased (i.e. traded)  // transaction input - not written to asset
//      */
//     async buy(ctx, issuer, paperNumber, currentOwner, newOwner, price, purchaseDateTime) {

//         // Retrieve the current paper using key fields provided
//         let paperKey = CommercialPaper.makeKey([issuer, paperNumber]);
//         let paper = await ctx.paperList.getPaper(paperKey);

//         // Validate current owner
//         if (paper.getOwner() !== currentOwner) {
//             throw new Error('\nPaper ' + issuer + paperNumber + ' is not owned by ' + currentOwner);
//         }

//         // First buy moves state from ISSUED to TRADING (when running )
//         if (paper.isIssued()) {
//             paper.setTrading();
//         }

//         // Check paper is not already REDEEMED
//         if (paper.isTrading()) {
//             paper.setOwner(newOwner);
//             // save the owner's MSP
//             let mspid = ctx.clientIdentity.getMSPID();
//             paper.setOwnerMSP(mspid);
//         } else {
//             throw new Error('\nPaper ' + issuer + paperNumber + ' is not trading. Current state = ' + paper.getCurrentState());
//         }

//         // Update the paper
//         await ctx.paperList.updatePaper(paper);
//         return paper;
//     }

//     /**
//       *  Buy request:  (2-phase confirmation: Commercial paper is 'PENDING' subject to completion of transfer by owning org)
//       *  Alternative to 'buy' transaction
//       *  Note: 'buy_request' puts paper in 'PENDING' state - subject to transfer confirmation [below].
//       *
//       * @param {Context} ctx the transaction context
//       * @param {String} issuer commercial paper issuer
//       * @param {Integer} paperNumber paper number for this issuer
//       * @param {String} currentOwner current owner of paper
//       * @param {String} newOwner new owner of paper                              // transaction input - not written to asset per se - but written to block
//       * @param {Integer} price price paid for this paper                         // transaction input - not written to asset per se - but written to block
//       * @param {String} purchaseDateTime time paper was requested                // transaction input - ditto.
//      */
//     async buy_request(ctx, issuer, paperNumber, currentOwner, newOwner, price, purchaseDateTime) {


//         // Retrieve the current paper using key fields provided
//         let paperKey = CommercialPaper.makeKey([issuer, paperNumber]);
//         let paper = await ctx.paperList.getPaper(paperKey);

//         // Validate current owner - this is really information for the user trying the sample, rather than any 'authorisation' check per se FYI
//         if (paper.getOwner() !== currentOwner) {
//             throw new Error('\nPaper ' + issuer + paperNumber + ' is not owned by ' + currentOwner + ' provided as a paraneter');
//         }
//         // paper set to 'PENDING' - can only be transferred (confirmed) by identity from owning org (MSP check).
//         paper.setPending();

//         // Update the paper
//         await ctx.paperList.updatePaper(paper);
//         return paper;
//     }

//     /**
//      * transfer commercial paper: only the owning org has authority to execute. It is the complement to the 'buy_request' transaction. '[]' is optional below.
//      * eg. issue -> buy_request -> transfer -> [buy ...n | [buy_request...n | transfer ...n] ] -> redeem
//      * this transaction 'pair' is an alternative to the straight issue -> buy -> [buy....n] -> redeem ...path
//      *
//      * @param {Context} ctx the transaction context
//      * @param {String} issuer commercial paper issuer
//      * @param {Integer} paperNumber paper number for this issuer
//      * @param {String} newOwner new owner of paper
//      * @param {String} newOwnerMSP  MSP id of the transferee
//      * @param {String} confirmDateTime  confirmed transfer date.
//     */
//     async transfer(ctx, issuer, paperNumber, newOwner, newOwnerMSP, confirmDateTime) {

//         // Retrieve the current paper using key fields provided
//         let paperKey = CommercialPaper.makeKey([issuer, paperNumber]);
//         let paper = await ctx.paperList.getPaper(paperKey);

//         // Validate current owner's MSP in the paper === invoking transferor's MSP id - can only transfer if you are the owning org.

//         if (paper.getOwnerMSP() !== ctx.clientIdentity.getMSPID()) {
//             throw new Error('\nPaper ' + issuer + paperNumber + ' is not owned by the current invoking Organisation, and not authorised to transfer');
//         }

//         // Paper needs to be 'pending' - which means you need to have run 'buy_pending' transaction first.
//         if ( ! paper.isPending()) {
//             throw new Error('\nPaper ' + issuer + paperNumber + ' is not currently in state: PENDING for transfer to occur: \n must run buy_request transaction first');
//         }
//         // else all good

//         paper.setOwner(newOwner);
//         // set the MSP of the transferee (so that, that org may also pass MSP check, if subsequently transferred/sold on)
//         paper.setOwnerMSP(newOwnerMSP);
//         paper.setTrading();
//         paper.confirmDateTime = confirmDateTime;

//         // Update the paper
//         await ctx.paperList.updatePaper(paper);
//         return paper;
//     }

//     /**
//      * Redeem commercial paper
//      *
//      * @param {Context} ctx the transaction context
//      * @param {String} issuer commercial paper issuer
//      * @param {Integer} paperNumber paper number for this issuer
//      * @param {String} redeemingOwner redeeming owner of paper
//      * @param {String} issuingOwnerMSP the MSP of the org that the paper will be redeemed with.
//      * @param {String} redeemDateTime time paper was redeemed
//     */
//     async redeem(ctx, issuer, paperNumber, redeemingOwner, issuingOwnerMSP, redeemDateTime) {

//         let paperKey = CommercialPaper.makeKey([issuer, paperNumber]);

//         let paper = await ctx.paperList.getPaper(paperKey);

//         // Check paper is not alread in a state of REDEEMED
//         if (paper.isRedeemed()) {
//             throw new Error('\nPaper ' + issuer + paperNumber + ' has already been redeemed');
//         }

//         // Validate current redeemer's MSP matches the invoking redeemer's MSP id - can only redeem if you are the owning org.

//         if (paper.getOwnerMSP() !== ctx.clientIdentity.getMSPID()) {
//             throw new Error('\nPaper ' + issuer + paperNumber + ' cannot be redeemed by ' + ctx.clientIdentity.getMSPID() + ', as it is not the authorised owning Organisation');
//         }

//         // As this is just a sample, can show additional verification check: that the redeemer provided matches that on record, before redeeming it
//         if (paper.getOwner() === redeemingOwner) {
//             paper.setOwner(paper.getIssuer());
//             paper.setOwnerMSP(issuingOwnerMSP);
//             paper.setRedeemed();
//             paper.redeemDateTime = redeemDateTime; // record redemption date against the asset (the complement to 'issue date')
//         } else {
//             throw new Error('\nRedeeming owner: ' + redeemingOwner + ' organisation does not currently own paper: ' + issuer + paperNumber);
//         }

//         await ctx.paperList.updatePaper(paper);
//         return paper;
//     }

//     // Query transactions

//     /**
//      * Query history of a commercial paper
//      * @param {Context} ctx the transaction context
//      * @param {String} issuer commercial paper issuer
//      * @param {Integer} paperNumber paper number for this issuer
//     */
//     async queryHistory(ctx, issuer, paperNumber) {

//         // Get a key to be used for History query

//         let query = new QueryUtils(ctx, 'org.papernet.paper');
//         let results = await query.getAssetHistory(issuer, paperNumber); // (cpKey);
//         return results;

//     }

//     /**
//     * queryOwner commercial paper: supply name of owning org, to find list of papers based on owner field
//     * @param {Context} ctx the transaction context
//     * @param {String} owner commercial paper owner
//     */
//     async queryOwner(ctx, owner) {

//         let query = new QueryUtils(ctx, 'org.papernet.paper');
//         let owner_results = await query.queryKeyByOwner(owner);

//         return owner_results;
//     }

//     /**
//     * queryPartial commercial paper - provide a prefix eg. "DigiBank" will list all papers _issued_ by DigiBank etc etc
//     * @param {Context} ctx the transaction context
//     * @param {String} prefix asset class prefix (added to paperlist namespace) eg. org.papernet.paperMagnetoCorp asset listing: papers issued by MagnetoCorp.
//     */
//     async queryPartial(ctx, prefix) {

//         let query = new QueryUtils(ctx, 'org.papernet.paper');
//         let partial_results = await query.queryKeyByPartial(prefix);

//         return partial_results;
//     }

//     /**
//     * queryAdHoc commercial paper - supply a custom mango query
//     * eg - as supplied as a param:
//     * ex1:  ["{\"selector\":{\"faceValue\":{\"$lt\":8000000}}}"]
//     * ex2:  ["{\"selector\":{\"faceValue\":{\"$gt\":4999999}}}"]
//     *
//     * @param {Context} ctx the transaction context
//     * @param {String} queryString querystring
//     */
//     async queryAdhoc(ctx, queryString) {

//         let query = new QueryUtils(ctx, 'org.papernet.paper');
//         let querySelector = JSON.parse(queryString);
//         let adhoc_results = await query.queryByAdhoc(querySelector);

//         return adhoc_results;
//     }


//     /**
//      * queryNamed - supply named query - 'case' statement chooses selector to build (pre-canned for demo purposes)
//      * @param {Context} ctx the transaction context
//      * @param {String} queryname the 'named' query (built here) - or - the adHoc query string, provided as a parameter
//      */
//     async queryNamed(ctx, queryname) {
//         let querySelector = {};
//         switch (queryname) {
//             case "redeemed":
//                 querySelector = { "selector": { "currentState": 4 } };  // 4 = redeemd state
//                 break;
//             case "trading":
//                 querySelector = { "selector": { "currentState": 3 } };  // 3 = trading state
//                 break;
//             case "value":
//                 // may change to provide as a param - fixed value for now in this sample
//                 querySelector = { "selector": { "faceValue": { "$gt": 4000000 } } };  // to test, issue CommPapers with faceValue <= or => this figure.
//                 break;
//             default: // else, unknown named query
//                 throw new Error('invalid named query supplied: ' + queryname + '- please try again ');
//         }

//         let query = new QueryUtils(ctx, 'org.papernet.paper');
//         let adhoc_results = await query.queryByAdhoc(querySelector);

//         return adhoc_results;
//     }

}

module.exports = PropertyContract;

