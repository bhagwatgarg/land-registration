/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
*/

'use strict';

// Utility class for ledger state
const State = require('../ledger-api/state.js');

// Enumerate commercial paper state values
const prState = {
    INITIATED: 1,
    ACCEPTED_BY_SELLER: 2,
    FINALIZED_BY_BUYER: 3,
    PAYMENT_DONE: 4,
    COMPLETED: 5,
    REJECTED: 6
};

/**
 * PropertyRequest class extends State class
 * Class will be used by application and smart contract to define a paper
 */
class PropertyRequest extends State {
    constructor(obj) {
        super(PropertyRequest.getClass(), [obj.requestID]);
        Object.assign(this, obj);
    }

    /**
     * Basic getters and setters
     */
    getBuyer() {
        return this.buyer;
    }

    setBuyer(newBuyer) {
        this.buyer = newBuyer;
    }

    getBuyerMSP() {
        return this.mspid;
    }

    setBuyerMSP(mspid) {
        this.mspid = mspid;
    }

    /**
     * Useful methods to encapsulate property request states
     */
    setInitiated() {
        this.currentState = prState.INITIATED;
    }

    setAcceptedBySeller() {
        this.currentState = prState.ACCEPTED_BY_SELLER;
    }

    setFinalizedByBuyer() {
        this.currentState = prState.ACCEPTED_BY_SELLER;
    }

    setPaymentDone() {
        this.currentState = prState.PAYMENT_DONE;
    }

    setCompleted() {
        this.currentState = prState.COMPLETED;
    }

    setRejected() {
        this.currentState = prState.REJECTED;
    }

    isInitiated() {
        return this.currentState === prState.INITIATED;
    }

    isAcceptedBySeller() {
        return this.currentState === prState.ACCEPTED_BY_SELLER;
    }

    isFinalizedByBuyer() {
        return this.currentState === prState.FINALIZED_BY_BUYER;
    }

    isPaymentDone() {
        return this.currentState === prState.PAYMENT_DONE;
    }

    isCompleted() {
        return this.currentState === prState.COMPLETED;
    }

    isRejected() {
        return this.currentState === prState.REJECTED;
    }

    static fromBuffer(buffer) {
        return PropertyRequest.deserialize(buffer);
    }

    toBuffer() {
        return Buffer.from(JSON.stringify(this));
    }

    /**
     * Deserialize a state data to property request
     * @param {Buffer} data to form back into the object
     */
    static deserialize(data) {
        return State.deserializeClass(data, PropertyRequest);
    }

    /**
     * Factory method to create a property request object
     */

    static createInstance(requestID, propertyID, buyer, amount) {
        return new PropertyRequest({ requestID, propertyID, buyer, amount });
    }

    static getClass() {
        return "org.land-reg.propertyrequest";
    }
}

module.exports = PropertyRequest;
