import * as categoryNormalize from './category/normalize';
import * as categoryValidate from './category/validate';
import * as categoryFormat from './category/format';

import * as brandNormalize from './brand/normalize';
import * as brandValidate from './brand/validate';
import * as brandFormat from './brand/format';

import * as modelNormalize from './model/normalize';
import * as modelValidate from './model/validate';
import * as modelFormat from './model/format';

import * as sparePartNormalize from './sparePart/normalize';
import * as sparePartValidate from './sparePart/validate';
import * as sparePartFormat from './sparePart/format';

import * as serviceTypeNormalize from './serviceType/normalize';
import * as serviceTypeValidate from './serviceType/validate';
import * as serviceTypeFormat from './serviceType/format';

import * as screenSizeNormalize from './screenSize/normalize';
import * as screenSizeValidate from './screenSize/validate';
import * as screenSizeFormat from './screenSize/format';

export const CatalogFacade = {
    category: {
        normalize: categoryNormalize,
        validate: categoryValidate,
        format: categoryFormat,
    },
    brand: {
        normalize: brandNormalize,
        validate: brandValidate,
        format: brandFormat,
    },
    model: {
        normalize: modelNormalize,
        validate: modelValidate,
        format: modelFormat,
    },
    sparePart: {
        normalize: sparePartNormalize,
        validate: sparePartValidate,
        format: sparePartFormat,
    },
    serviceType: {
        normalize: serviceTypeNormalize,
        validate: serviceTypeValidate,
        format: serviceTypeFormat,
    },
    screenSize: {
        normalize: screenSizeNormalize,
        validate: screenSizeValidate,
        format: screenSizeFormat,
    }
};

export { validateCatalogName, hasCatalogPollution } from './common/validation';
