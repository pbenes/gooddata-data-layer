import { AFM } from '@gooddata/typings';
import {
    Granularities
} from '../../constants/granularities';
import {
    isNotEmptyFilter,
    mergeFilters,
    handleMeasureDateFilter
} from '../filters';

describe('isNotEmptyFilter', () => {
    it('should return true for date filter', () => {
        const dateFilter: AFM.IRelativeDateFilter = {
            relativeDateFilter: {
                dataSet: {
                    identifier: 'date filter'
                },
                from: 0,
                to: 0,
                granularity: Granularities.MONTH
            }
        };

        expect(isNotEmptyFilter(dateFilter)).toBe(true);
    });

    it('should return false for empty positive filter', () => {
        const attributeFilter: AFM.IPositiveAttributeFilter = {
            positiveAttributeFilter: {
                displayForm: {
                    identifier: 'empty filter'
                },
                in: []
            }
        };

        expect(isNotEmptyFilter(attributeFilter)).toBe(false);
    });

    it('should return true for filled positive filter', () => {
        const attributeFilter: AFM.IPositiveAttributeFilter = {
            positiveAttributeFilter: {
                displayForm: {
                    identifier: 'filled filter'
                },
                in: ['1', '2', '3']
            }
        };

        expect(isNotEmptyFilter(attributeFilter)).toBe(true);
    });

    it('should return false for empty negative filter', () => {
        const attributeFilter: AFM.INegativeAttributeFilter = {
            negativeAttributeFilter: {
                displayForm: {
                    identifier: 'empty filter'
                },
                notIn: []
            }
        };

        expect(isNotEmptyFilter(attributeFilter)).toBe(false);
    });

    it('should return true for filled negative filter', () => {
        const attributeFilter: AFM.INegativeAttributeFilter = {
            negativeAttributeFilter: {
                displayForm: {
                    identifier: 'filled filter'
                },
                notIn: ['1', '2', '3']
            }
        };

        expect(isNotEmptyFilter(attributeFilter)).toBe(true);
    });
});

describe('mergeFilters', () => {
    it('should concat existing filters with user filters', () => {
        const afm: AFM.IAfm = {
            filters: [
                {
                    positiveAttributeFilter: {
                        displayForm: {
                            identifier: 'filter'
                        },
                        in: ['1', '2', '3']
                    }
                }
            ]
        };

        const filters: AFM.FilterItem[] = [
            {
                positiveAttributeFilter: {
                    displayForm: {
                        identifier: 'user filter'
                    },
                    in: ['4', '5', '6']
                }
            }
        ];

        const expectedAfm: AFM.IAfm = {
            filters: [
                {
                    positiveAttributeFilter: {
                        displayForm: {
                            identifier: 'filter'
                        },
                        in: ['1', '2', '3']
                    }
                },
                {
                    positiveAttributeFilter: {
                        displayForm: {
                            identifier: 'user filter'
                        },
                        in: ['4', '5', '6']
                    }
                }
            ]
        };

        expect(mergeFilters(afm, filters)).toEqual(expectedAfm);
    });

    it('should handle AFM without filters', () => {
        const afm: AFM.IAfm = {};

        const filters: AFM.FilterItem[] = [
            {
                positiveAttributeFilter: {
                    displayForm: {
                        identifier: 'user filter'
                    },
                    in: ['4', '5', '6']
                }
            }
        ];
        const expectedAfm: AFM.IAfm = {
            filters: [
                {
                    positiveAttributeFilter: {
                        displayForm: {
                            identifier: 'user filter'
                        },
                        in: ['4', '5', '6']
                    }
                }
            ]
        };

        expect(mergeFilters(afm, filters)).toEqual(expectedAfm);
    });
});

describe('handleMeasureDateFilter', () => {
    const measureWithDateFilter: AFM.IMeasure = {
        localIdentifier: 'm1',
        definition: {
            measure: {
                item: {
                    identifier: 'm1'
                },
                filters: [
                    {
                        absoluteDateFilter: {
                            dataSet: {
                                identifier: 'd2'
                            },
                            from: '1',
                            to: '2'
                        }
                    }
                ]
            }
        }
    };
    const globalDateFilter: AFM.DateFilterItem = {
        absoluteDateFilter: {
            dataSet: {
                identifier: 'd1'
            },
            from: '1',
            to: '2'
        }
    };
    it('should move global filter to measures without date filter, if some metric has date filter', () => {
        const afm: AFM.IAfm = {
            measures: [
                measureWithDateFilter,
                {
                    localIdentifier: 'm2',
                    definition: {
                        measure: {
                            item: {
                                identifier: 'm2'
                            }
                        }
                    }
                },
                {
                    localIdentifier: 'm3',
                    definition: {
                        measure: {
                            item: {
                                identifier: 'm3'
                            }
                        }
                    }
                }
            ],
            filters: [
                globalDateFilter
            ]
        };

        const expectedAfm: AFM.IAfm = {
            measures: [
                measureWithDateFilter,
                {
                    localIdentifier: 'm2',
                    definition: {
                        measure: {
                            item: {
                                identifier: 'm2'
                            },
                            filters: [globalDateFilter]
                        }
                    }
                },
                {
                    localIdentifier: 'm3',
                    definition: {
                        measure: {
                            item: {
                                identifier: 'm3'
                            },
                            filters: [globalDateFilter]
                        }
                    }
                }
            ],
            filters: []
        };
        expect(handleMeasureDateFilter(afm)).toEqual(expectedAfm);
    });

    it('should not modify AFM if no metric has date filter', () => {
        const afm: AFM.IAfm = {
            measures: [
                {
                    localIdentifier: 'm2',
                    definition: {
                        measure: {
                            item: {
                                identifier: 'm2'
                            }
                        }
                    }
                }
            ],
            filters: [
                globalDateFilter
            ]
        };
        expect(handleMeasureDateFilter(afm)).toEqual(afm);
    });

    it('should remove global filter if there is one measure with date filter', () => {
        const afm: AFM.IAfm = {
            measures: [
                measureWithDateFilter
            ],
            filters: [
                globalDateFilter
            ]
        };
        const expectedAfm: AFM.IAfm = {
            measures: [
                measureWithDateFilter
            ],
            filters: []
        };
        expect(handleMeasureDateFilter(afm)).toEqual(expectedAfm);
    });

    it('should handle AFM without measures', () => {
        const afmWithFilterOnly: AFM.IAfm = {
            filters: [globalDateFilter]
        };

        expect(handleMeasureDateFilter(afmWithFilterOnly)).toEqual(afmWithFilterOnly);
    });
});
