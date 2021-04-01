/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
*/

'use strict';

// Utility class for ledger state
const State = require('../ledger-api/state.js');

// Enumerate commercial paper state values
const cpState = {
    INITIATED: 1,
    ACCEPTED_BY_SELLER: 2,
    PAYMENT_DONE: 3,
    COMPLETED: 4,
    REJECTED: 5
};

/**
 * PropertyRequest class extends State class
 * Class will be used by application and smart contract to define a paper
 */
class PropertyRequest extends State {

    constructor(obj) {
        super(PropertyRequest.getClass(), [obj.buyer, obj.requestID]);
        Object.assign(this, obj);
    }

    /**
     * Basic getters and setters
    */
    getBuyer() {
        return this.buyer;
    }

    setBuyerMSP(mspid) {
        this.mspid = mspid;
    }

    getBuyerMSP() {
        return this.mspid;
    }

    /**
     * Useful methods to encapsulate property request states
     */
    setInitiated() {
        this.currentState = cpState.INITIATED;
    }

    setAcceptedBySeller() {
        this.currentState = cpState.ACCEPTED_BY_SELLER;
    }

    setPaymentDone() {
        this.currentState = cpState.PAYMENT_DONE;
    }

    setCompleted() {
        this.currentState = cpState.COMPLETED;
    }

    setRejected() {
        this.currentState = cpState.REJECTED;
    }

    isInitiated() {
        return this.currentState === cpState.INITIATED;
    }

    isAcceptedBySeller() {
        return this.currentState === cpState.ACCEPTED_BY_SELLER;
    }

    isPaymentDone() {
        return this.currentState === cpState.PAYMENT_DONE;
    }

    isCompleted() {
        return this.currentState === cpState.COMPLETED;
    }

    isRejected() {
        return this.currentState === cpState.REJECTED;
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
        return new PropertyRequest({requestID, propertyID, buyer, amount});
    }

    static getClass() {
        return 'org.land-reg.propertyrequest';
    }
}

module.exports = PropertyRequest;
