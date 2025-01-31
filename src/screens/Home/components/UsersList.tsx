import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ScrollView, StyleSheet, TouchableOpacity, View} from 'react-native';
import {Navigation, NavigationFunctionComponent} from 'react-native-navigation';
import {removeUser} from '../../../app/actions/users';
import {TUser} from '../../../app/API';
import {fetchUsersThunk} from '../../../app/asyncActions/users';
import {DEFAULT_USERS_LIMIT} from '../../../app/constants';
import {useAppDispatch, useAppSelector, useFavorite, useUsersListData} from '../../../app/hooks';

import {COMMON_STYLES} from '../../../styles';

import FindInput from './FindInput';
import {Loader} from './Loader/Loader';
import Pagination from './Pagination';
import {UserItem} from './UserItem';
import {removeFavorite, setFavorite} from '../../../app/actions/favorites';

const UsersList: NavigationFunctionComponent = ({componentId}) => {
    const [filter, setFilter] = React.useState('');
    const dispatch = useAppDispatch();
    const [currentPage, setCurrentPage] = useState(1);
    const cursor = (currentPage - 1) * DEFAULT_USERS_LIMIT;

    const dataProps = useMemo(() => ({cursor, filter}), [cursor, filter]);
    const {users, usersLength} = useUsersListData(dataProps);
    const {checkIsFavorite} = useFavorite();
    const status = useAppSelector(state => state.users.status);

    useEffect(() => {
        dispatch(fetchUsersThunk());
    }, [dispatch]);

    const handleChangePage = useCallback((page: number) => setCurrentPage(page), []);

    const handleRemoveUser = useCallback(
        (id: number) => {
            dispatch(removeUser(id));
            dispatch(removeFavorite(id));
        },
        [dispatch],
    );

    const handleChangeFavorite = useCallback(
        (id: number) => () => {
            const isFavorite = checkIsFavorite(id);

            if (isFavorite) {
                dispatch(removeFavorite(id));
            } else {
                dispatch(setFavorite(id));
            }
        },
        [checkIsFavorite, dispatch],
    );

    const handleFindChange = useCallback((text: string) => {
        setFilter(text);
    }, []);

    const handleSelectUser = useCallback(
        (user: TUser) => () => {
            Navigation.push(componentId, {
                component: {
                    name: 'UserDetail',
                    passProps: {id: user.id},
                },
            });
        },
        [componentId],
    );

    const renderItem = useCallback(
        (item: TUser) => (
            <TouchableOpacity key={item.id} style={styles.itemWrapper} onPress={handleSelectUser(item)}>
                <UserItem
                    onRemove={handleRemoveUser}
                    item={item}
                    onChangeFavorite={handleChangeFavorite(item.id)}
                    isFavorite={checkIsFavorite(item.id)}
                />
            </TouchableOpacity>
        ),
        [checkIsFavorite, handleChangeFavorite, handleRemoveUser, handleSelectUser],
    );

    return (
        <View style={styles.root}>
            <View style={styles.headerContainer}>
                <FindInput value={filter} onChangeText={handleFindChange} />
            </View>
            <View style={styles.root}>
                {status === 'loading' ? (
                    <Loader />
                ) : (
                    // key is used as lazy implementation of scroll to top
                    <ScrollView key={cursor} style={styles.scroll} contentContainerStyle={styles.scrollContainer}>
                        {users.map(renderItem)}
                    </ScrollView>
                )}
            </View>
            <View style={styles.paginationContainer}>
                <Pagination itemsLength={usersLength} onPressPage={handleChangePage} currentPage={currentPage} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    root: {flex: 1},
    paginationContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
    },
    headerContainer: {
        ...COMMON_STYLES.mt_1,
        ...COMMON_STYLES.mh_2,
        ...COMMON_STYLES.pb_1,
    },
    scroll: {
        ...COMMON_STYLES.mh_1,
    },
    scrollContainer: {
        flexGrow: 1,
        ...COMMON_STYLES.pb_4,
    },
    itemWrapper: {
        ...COMMON_STYLES.mt_2,
    },
});

export default UsersList;
