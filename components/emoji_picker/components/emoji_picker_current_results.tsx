// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {forwardRef, memo, useCallback, useMemo} from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import {VariableSizeList, ListItemKeySelector, ListOnScrollProps} from 'react-window';

import {Emoji, EmojiCategory} from 'mattermost-redux/types/emojis';

import {NoResultsVariant} from 'components/no_results_indicator/types';

import NoResultsIndicator from 'components/no_results_indicator';

import {Categories, CategoriesOffsets, CategoryOrEmojiRow} from '../types';

import {SEARCH_EMOJI_CATEGORY, SEARCH_RESULTS, EMOJI_PER_ROW, EMOJI_ROW_HEIGHT, CATEGORY_HEADER_ROW_HEIGHT} from '../constants';

import {getEmojisByCategory} from '../utils';

import EmojiPickerCategoryOrEmojiRow from './emoji_picker_category_or_emoji_row';

// If this changes, the spaceRequiredAbove and spaceRequiredBelow props passed to the EmojiPickerOverlay must be updated
const EMOJI_CONTAINER_HEIGHT = 290;
const EMOJI_PICKER_ITEMS_STYLES = {
    height: EMOJI_CONTAINER_HEIGHT,
};

interface Props {
    filter: string;
    activeCategory: EmojiCategory;
    categories: Categories;
    allEmojis: Record<string, Emoji>;
    recentEmojis: string[];
    userSkinTone: string;
    setActiveCategory: (category: EmojiCategory) => void;
}

const EmojiPickerCurrentResults = forwardRef<VariableSizeList<CategoryOrEmojiRow[]>, Props>(({filter, activeCategory, categories, allEmojis, recentEmojis, userSkinTone, setActiveCategory}: Props, ref) => {
    const categoryNamesArray = useMemo(() => {
        if (filter.length) {
            return [SEARCH_RESULTS];
        }

        return Object.keys(categories);
    }, [filter, categories]);

    // creates an array of category names and emoji to be rendered as rows
    const [categoryOrEmojisRows, categoryOrEmojisRowsCount, categoriesOffsetsAndIndices] = useMemo(() => {
        const categoryOrEmojisRows: CategoryOrEmojiRow[] = [];
        const categoriesOffsetsAndIndices: CategoriesOffsets = {
            categories: [],
            offsets: [],
            rowIndices: [0], // the first row index is always zero
        };

        let allPreviousCategoriesOffsets = 0;
        let allPreviousCategoriesRowIndices = 0;
        categoryNamesArray.forEach((categoryName) => {
            const category = filter.length ? SEARCH_EMOJI_CATEGORY.searchResults : categories[categoryName as EmojiCategory];
            const emojis = getEmojisByCategory(
                allEmojis,
                categories,
                category.name,
                filter,
                recentEmojis,
                userSkinTone,
            );

            categoryOrEmojisRows.push({
                type: 'categoryHeaderRow',
                row: category.name,
            });

            // Create `EMOJI_PER_ROW` row lenght array of emojis
            let emojisIndividualRow: Emoji[] = [];
            emojis.forEach((emoji, index) => {
                emojisIndividualRow.push(emoji);
                if ((index + 1) % EMOJI_PER_ROW === 0) {
                    categoryOrEmojisRows.push({
                        type: 'emojisRow',
                        row: emojisIndividualRow,
                    });
                    emojisIndividualRow = [];
                }
            });

            // If there are emojis left over that is less than `EMOJI_PER_ROW`, add them to the previous row
            if (emojisIndividualRow.length) {
                categoryOrEmojisRows.push({
                    type: 'emojisRow',
                    row: emojisIndividualRow,
                });
            }

            const numberOfRows = Math.ceil(emojis.length / EMOJI_PER_ROW);

            // allPreviousCategoriesOffsets is added to each category offset since a category's offset
            // is equal to all previous offset + current category's offset
            const approxRowsHeightTillNextCategory = allPreviousCategoriesOffsets + (numberOfRows * EMOJI_ROW_HEIGHT) + CATEGORY_HEADER_ROW_HEIGHT;
            allPreviousCategoriesOffsets = approxRowsHeightTillNextCategory;

            categoriesOffsetsAndIndices.offsets.push(approxRowsHeightTillNextCategory);
            categoriesOffsetsAndIndices.categories.push(category.name);

            // The last index is the end row of the custom category, which we dont scroll to.
            if (categoryName !== 'custom') {
                // one is added in the end for category header row
                const nextCategoryIndex = allPreviousCategoriesRowIndices + numberOfRows + 1;
                allPreviousCategoriesRowIndices = nextCategoryIndex;

                categoriesOffsetsAndIndices.rowIndices.push(nextCategoryIndex);
            }
        });

        return [categoryOrEmojisRows, categoryOrEmojisRows.length, categoriesOffsetsAndIndices];
    }, [filter, categories, allEmojis, recentEmojis]);

    // when filter is applied, If there is only one category (search) and it is empty, that means no results found for search
    const isSearchEmpty = useMemo(() => {
        return filter.length !== 0 && categoryOrEmojisRowsCount === 1 && categoryOrEmojisRows[0].row === SEARCH_RESULTS;
    }, [filter, categoryOrEmojisRows]);

    // Function to create unique key for each row
    const getItemKey = useCallback((index: Parameters<ListItemKeySelector>[0], rowsData: Parameters<ListItemKeySelector<CategoryOrEmojiRow[]>>[1]) => {
        const row = rowsData[index];
        if (row.type === 'categoryHeaderRow') {
            return row.row as string;
        }

        const emojisRow = row.row as Emoji[];
        const emojiNamesArray = emojisRow.map((emoji) => emoji.name);
        return emojiNamesArray.join('--');
    }, []);

    // Function to return the height of each row
    const getItemSize = useCallback((index: number) => {
        if (categoryOrEmojisRows[index].type === 'categoryHeaderRow') {
            return CATEGORY_HEADER_ROW_HEIGHT;
        }

        return EMOJI_ROW_HEIGHT;
    }, [categoryOrEmojisRows]);

    const handleScroll = useCallback(({scrollOffset}: ListOnScrollProps) => {
        if (filter.length) {
            return null;
        }

        const {categories, offsets} = categoriesOffsetsAndIndices;

        const closestOffset = offsets.findIndex((offset) => scrollOffset < offset);
        const closestCategory = categories[closestOffset];

        if (closestCategory !== activeCategory) {
            setActiveCategory(closestCategory);
        }
        return null;
    }, [filter, categoriesOffsetsAndIndices, activeCategory]);

    if (isSearchEmpty) {
        return (
            <NoResultsIndicator
                variant={NoResultsVariant.ChannelSearch}
                titleValues={{channelName: `"${filter}"`}}
            />
        );
    }

    return (
        <div
            className='emoji-picker__items'
            style={EMOJI_PICKER_ITEMS_STYLES}
        >
            <div className='emoji-picker__container'>
                <AutoSizer>
                    {({height, width}) => (
                        <VariableSizeList
                            ref={ref}
                            height={height}
                            width={width}
                            layout='vertical'
                            itemCount={categoryOrEmojisRowsCount}
                            itemData={categoryOrEmojisRows}
                            itemKey={getItemKey}
                            estimatedItemSize={EMOJI_ROW_HEIGHT}
                            itemSize={getItemSize}
                            onScroll={handleScroll}
                        >
                            {EmojiPickerCategoryOrEmojiRow}
                        </VariableSizeList>
                    )}
                </AutoSizer>
            </div>
        </div>
    );
});

EmojiPickerCurrentResults.displayName = 'EmojiPickerCurrentResults';

export default memo(EmojiPickerCurrentResults);
