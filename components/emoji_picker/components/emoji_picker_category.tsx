// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {memo, useMemo} from 'react';
import {FormattedMessage} from 'react-intl';
import classNames from 'classnames';

import {Category} from 'components/emoji_picker/types';

import {Constants} from 'utils/constants';

import OverlayTrigger from 'components/overlay_trigger';
import Tooltip from 'components/tooltip';

interface Props {
    category: Category;
    selected: boolean;
    enable: boolean;
    onClick: (categoryName: string) => void;
}

function EmojiPickerCategory({category, selected, enable, onClick}: Props) {
    const handleClick = (event: React.MouseEvent) => {
        event.preventDefault();

        if (enable) {
            onClick(category.name);
        }
    };

    const className = useMemo(() => {
        return classNames('emoji-picker__category', {
            'emoji-picker__category--selected': selected,
            disable: !enable,
        });
    }, [selected, enable]);

    return (
        <OverlayTrigger
            trigger={['hover']}
            delayShow={Constants.OVERLAY_TIME_DELAY}
            placement='bottom'
            overlay={
                <Tooltip
                    id='skinTooltip'
                    className='emoji-tooltip'
                >
                    <FormattedMessage
                        id={`emoji_picker.${category.name}`}
                        defaultMessage={category.message}
                    />
                </Tooltip>
            }
        >
            <a
                className={className}
                href='#'
                onClick={handleClick}
                aria-label={category.id}
            >
                <i className={category.className}/>
            </a>
        </OverlayTrigger>
    );
}

export default memo(EmojiPickerCategory);
