/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
*/

'use strict';

// Utility class for collections of ledger states --  a state list
const StateList = require('../ledger-api/statelist.js');

const PropertyRequest = require('./propertyRequest.js');

class PropertyRequestList extends StateList {

    constructor(ctx) {
        super(ctx, 'org.land-reg.propertyrequestlist');
        this.use(PropertyRequest);
    }

    async addPropertyRequest(request) {
        return this.addState(request);
    }

    async getPropertyRequest(requestKey) {
        return this.getState(requestKey);
    }

    async updatePropertyRequest(request) {
        return this.updateState(request);
    }
}


module.exports = PropertyRequestList;
