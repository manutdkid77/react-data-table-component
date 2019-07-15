import React, { PureComponent, createContext } from 'react';
import PropTypes from 'prop-types';
import { insertItem, removeItem } from './util';

export function reducer(state, action) {
  switch (action.type) {
    case 'SELECT_ALL': {
      const allChecked = !state.allSelected;

      return {
        ...state,
        allSelected: allChecked,
        selectedCount: allChecked ? action.data.length : 0,
        selectedRows: allChecked ? action.data : [],
      };
    }

    case 'SORT_CHANGE': {
      const { sortColumn, sortDirection } = action;

      return {
        ...state,
        sortColumn,
        sortDirection,
      };
    }

    case 'ROW_SELECTED': {
      const { selectedRows } = state;
      const { row, data } = action;

      if (selectedRows.find(r => r === row)) {
        return {
          ...state,
          selectedCount: selectedRows.length > 0 ? selectedRows.length - 1 : 0,
          allSelected: false,
          selectedRows: removeItem(selectedRows, row),
        };
      }

      return {
        ...state,
        selectedCount: selectedRows.length + 1,
        allSelected: selectedRows.length + 1 === data.length,
        selectedRows: insertItem(selectedRows, row),
      };
    }

    case 'CHANGE_PAGE': {
      return {
        ...state,
        currentPage: action.page,
      };
    }

    case 'CHANGE_ROWS_PER_PAGE': {
      const { rowsPerPage, page } = action;

      return {
        ...state,
        currentPage: page,
        rowsPerPage,
      };
    }

    case 'CLEAR_SELECTED_ROWS': {
      const { selectedRowsFlag } = action;

      return {
        ...state,
        allSelected: false,
        selectedCount: 0,
        selectedRows: [],
        selectedRowsFlag,
      };
    }

    default: {
      throw new Error(`Unhandled action type: ${action.type}`);
    }
  }
}

export const DataTableContext = createContext();

export class DataTableProvider extends PureComponent {
  static propTypes = {
    initialState: PropTypes.object.isRequired,
    children: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.node),
      PropTypes.node,
    ]).isRequired,
  };

  render() {
    const { children, initialState } = this.props;

    return (
      <DataTableContext.Provider value={initialState}>
        {children}
      </DataTableContext.Provider>
    );
  }
}
