// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {KeyboardEvent, memo, useCallback, useMemo} from 'react';

import {EmojiCategory} from 'mattermost-redux/types/emojis';

import {RECENT_EMOJI_CATEGORY, CATEGORIES, EMOJI_PER_ROW} from 'components/emoji_picker/constants';

import EmojiPickerCategory from 'components/emoji_picker/components/emoji_picker_category';

interface Props {
    recentEmojis: string[];
    filter: string;
    active: EmojiCategory;
    onClick: (categoryName: string) => void;
    selectNextEmoji: (offset?: number) => void;
    selectPrevEmoji: (offset?: number) => void;
    focusOnSearchInput: () => void;
}

function EmojiPickerCategories({
    recentEmojis,
    filter,
    active,
    onClick,
    selectNextEmoji,
    selectPrevEmoji,
    focusOnSearchInput,
}: Props) {
    const categories = useMemo(() => (recentEmojis.length ? {...RECENT_EMOJI_CATEGORY, ...CATEGORIES} : CATEGORIES), [recentEmojis]);

    const handleKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
        switch (event.key) {
        case 'ArrowRight':
            event.preventDefault();
            selectNextEmoji();
            break;
        case 'ArrowLeft':
            event.preventDefault();
            selectPrevEmoji();
            break;
        case 'ArrowUp':
            event.preventDefault();
            selectPrevEmoji(EMOJI_PER_ROW);
            break;
        case 'ArrowDown':
            event.preventDefault();
            selectNextEmoji(EMOJI_PER_ROW);
            break;
        }

        focusOnSearchInput();
    }, [selectNextEmoji, selectPrevEmoji]);

    // change this
    // const currentCategoryName = filter ? categoryKeys[0] : categoryKeys[1];

    const emojiPickerCategories = useMemo(() => Object.keys(categories).map((categoryName) => {
        const category = categories[categoryName as EmojiCategory];

        return (
            <EmojiPickerCategory
                key={'header-' + category.name}
                category={category}
                onClick={onClick}
                selected={active === category.name}
                enable={filter.length === 0}
            />
        );
    }), [categories, filter, active]);

    return (
        <div
            id='emojiPickerCategories'
            className='emoji-picker__categories'
            onKeyDown={handleKeyDown}
        >
            {emojiPickerCategories}
        </div>
    );
}

export default memo(EmojiPickerCategories);
