// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Emoji, EmojiCategory} from 'mattermost-redux/types/emojis';

import * as EmojiUtils from 'utils/emoji.jsx';

import {getSkin} from 'utils/emoticons';
import {compareEmojis} from 'utils/emoji_utils';

import {Categories} from '../types';

function sortEmojis(emojis: Emoji[], recentEmojiStrings: string[], filter: string) {
    const recentEmojis: Emoji[] = [];
    const emojisMinusRecent: Emoji[] = [];

    Object.values(emojis).forEach((emoji) => {
        let emojiArray = emojisMinusRecent;
        const alias = 'short_names' in emoji ? emoji.short_names : [emoji.name];
        for (let i = 0; i < alias.length; i++) {
            if (recentEmojiStrings.includes(alias[i].toLowerCase())) {
                emojiArray = recentEmojis;
            }
        }

        emojiArray.push(emoji);
    });

    return [
        ...recentEmojis.sort((firstEmoji, secondEmoji) => compareEmojis(firstEmoji, secondEmoji, filter)),
        ...emojisMinusRecent.sort((firstEmoji, secondEmoji) => compareEmojis(firstEmoji, secondEmoji, filter)),
    ];
}

function getFilteredEmojis(allEmojis: Record<string, Emoji>, filter: string, recentEmojisString: string[]): Emoji[] {
    const emojis = Object.values(allEmojis).filter((emoji) => {
        const alias = 'short_names' in emoji ? emoji.short_names : [emoji.name];
        for (let i = 0; i < alias.length; i++) {
            if (alias[i].toLowerCase().includes(filter)) {
                return true;
            }
        }

        return false;
    });

    return sortEmojis(emojis, recentEmojisString, filter);
}

const convertEmojiToUserSkinTone = (emoji: Emoji, emojiSkin: string, userSkinTone: string): Emoji => {
    if (emojiSkin === userSkinTone) {
        return emoji;
    }

    let newEmojiId = '';

    // If its a default (yellow) emoji, get the skin variation from its property
    if (emojiSkin === 'default') {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        newEmojiId = emoji.skin_variations[userSkinTone].unified;
    } else if (userSkinTone === 'default') {
        // If default (yellow) skin is selected, remove the skin code from emoji id
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        newEmojiId = emoji.unified.replace(`-${emojiSkin}`, '');
    } else {
        // If non default skin is selected, add the new skin selected code to emoji id
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        newEmojiId = emoji.unified.replace(emojiSkin, userSkinTone);
    }

    const emojiIndex = EmojiUtils.EmojiIndicesByUnicode.get(newEmojiId.toLowerCase()) as number;
    return EmojiUtils.Emojis[emojiIndex];
}

export function getEmojisByCategory(allEmojis: Record<string, Emoji>, categories: Categories, categoryName: EmojiCategory, filter: string, recentEmojisString: string[], userSkinTone: string): Emoji[] {
    if (filter.length) {
        return getFilteredEmojis(allEmojis, filter, recentEmojisString);
    }

    if (categoryName === 'recent') {
        const recentEmojiIds = categories?.recent?.emojiIds ?? [];
        if (recentEmojiIds.length === 0) {
            return [];
        }

        const recentEmojis = new Map();

        recentEmojiIds.forEach((emojiId) => {
            const emoji = allEmojis[emojiId];
            const emojiSkin = getSkin(emoji);

            if (emojiSkin) {
                const emojiWithUserSkin = convertEmojiToUserSkinTone(emoji, emojiSkin, userSkinTone);
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                recentEmojis.set(emojiWithUserSkin.unified, emojiWithUserSkin);
            } else {
                recentEmojis.set(emojiId, emoji);
            }
        });

        return Array.from(recentEmojis.values());
    }

    return categories[categoryName].emojiIds.map((emojiId) => allEmojis[emojiId]) as Emoji[];
}
