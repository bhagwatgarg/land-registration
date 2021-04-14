/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
*/

'use strict';

// Utility class for ledger state
const State = require('../ledger-api/state.js');

// Enumerate commercial paper state values
const pState = {
    LISTED:1,
    NOT_LISTED:2,
    LISTING_PENDING:3
};

/**
 * Property class extends State class
 * Class will be used by application and smart contract to define a paper
 */
class Property extends State {
    constructor(obj) {
        super(Property.getClass(), [obj.propertyID]);
        Object.assign(this, obj);
    }

    /**
     * Basic getters and setters
     */
    getOwner() {
        return this.owner;
    }

    setOwner(newOwner) {
        this.owner = newOwner;
    }

    getOwnerMSP() {
        return this.mspid;
    }

    setOwnerMSP(mspid) {
        this.mspid = mspid;
    }

    /**
     * Useful methods to encapsulate property states
     */
    setListed() {
        this.currentState = pState.LISTED;
    }

    setNotListed() {
        this.currentState = pState.NOT_LISTED;
    }

    setListingPending() {
        this.currentState = pState.LISTING_PENDING;
    }

    isListed() {
        return this.currentState === pState.LISTED;
    }

    isNotListed() {
        return this.currentState === pState.NOT_LISTED;
    }

    isListingPending() {
        return this.currentState === pState.LISTING_PENDING;
    }

    static fromBuffer(buffer) {
        return Property.deserialize(buffer);
    }

    toBuffer() {
        return Buffer.from(JSON.stringify(this));
    }

    /**
     * Deserialize a state data to property
     * @param {Buffer} data to form back into the object
     */
    static deserialize(data) {
        return State.deserializeClass(data, Property);
    }

    /**
     * Factory method to create a property object
     */

    static createInstance(propertyID, owner, address) {
        return new Property({ propertyID, owner, address });
    }

    static getClass() {
        return "org.land-reg.property";
    }
}

module.exports = Property;
