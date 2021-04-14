/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
*/

'use strict';

// Utility class for collections of ledger states --  a state list
const StateList = require('../ledger-api/statelist.js');

const Property = require('./property.js');

class PropertyList extends StateList {

    constructor(ctx) {
        super(ctx, 'org.land-reg.propertylist');
        this.use(Property);
    }

    async addProperty(property) {
        return this.addState(property);
    }

    async getProperty(propertyKey) {
        return this.getState(propertyKey);
    }

    async updateProperty(property) {
        return this.updateState(property);
    }
}


module.exports = PropertyList;
