import React, { useReducer, useMemo, useCallback, useEffect, useRef } from 'react';
import { ThemeProvider } from 'styled-components';
import merge from 'lodash/merge';
import { DataTableProvider, reducer } from './DataTableContext';
import Table from './Table';
import TableHead from './TableHead';
import TableFooter from './TableFooter';
import TableHeadRow from './TableHeadRow';
import TableRow from './TableRow';
import TableCol from './TableCol';
import TableColCheckbox from './TableColCheckbox';
import TableHeader from './TableHeader';
import TableSubheader from './TableSubheader';
import TableBody from './TableBody';
import ResponsiveWrapper from './ResponsiveWrapper';
import ProgressWrapper from './ProgressWrapper';
import TableWrapper from './TableWrapper';
import { CellBase } from './Cell';
import NoData from './NoData';
import NativePagination from './Pagination';
import { propTypes, defaultProps } from './propTypes';
import { sort, decorateColumns, getSortDirection, getNumberOfPages } from './util';
import getDefaultTheme from '../themes/default';

const DataTable = ({
  data,
  columns,
  keyField,
  selectableRowsComponent,
  selectableRowsComponentProps,
  expandableIcon,
  onChangeRowsPerPage,
  onChangePage,
  paginationServer,
  paginationTotalRows,
  paginationDefaultPage,
  paginationPerPage,
  paginationRowsPerPageOptions,
  paginationIconLastPage,
  paginationIconFirstPage,
  paginationIconNext,
  paginationIconPrevious,
  paginationComponent,
  paginationComponentOptions,
  title,
  customTheme,
  actions,
  className,
  style,
  responsive,
  overflowY,
  overflowYOffset,
  progressPending,
  progressComponent,
  progressCentered,
  noDataComponent,
  disabled,
  noHeader,
  fixedHeader,
  fixedHeaderScrollHeight,
  pagination,
  subHeader,
  subHeaderAlign,
  subHeaderWrap,
  subHeaderComponent,
  contextTitle,
  contextActions,
  selectableRows,
  expandableRows,
  onRowClicked,
  sortIcon,
  onSort,
  sortFunction,
  striped,
  highlightOnHover,
  pointerOnHover,
  expandableRowsComponent,
  expandableDisabledField,
  defaultExpandedField,
  defaultSortField,
  defaultSortAsc,
  clearSelectedRows,
  onTableUpdate,
}) => {
  const initialState = {
    allSelected: false,
    selectedCount: 0,
    selectedRows: [],
    sortColumn: defaultSortField,
    sortDirection: getSortDirection(defaultSortAsc),
    selectedRowsFlag: false,
    currentPage: paginationDefaultPage,
    rowsPerPage: paginationPerPage,
  };

  const [state, dispatch] = useReducer(reducer, initialState);

  const {
    rowsPerPage,
    currentPage,
    selectedRows,
    allSelected,
    selectedCount,
    sortColumn,
    sortDirection,
    selectedRowsFlag,
  } = state;

  const init = {
    selectedCount,
    sortColumn,
    sortDirection,
    keyField,
    selectableRowsComponent,
    selectableRowsComponentProps,
    expandableIcon,
    paginationRowsPerPageOptions,
    paginationIconLastPage,
    paginationIconFirstPage,
    paginationIconNext,
    paginationIconPrevious,
    paginationComponentOptions,
    contextTitle,
    contextActions,
    indeterminate: selectedRows.length > 0 && !allSelected,
    data,
    pagination,
    paginationServer,
  };

  // Basically componentDidUpdate - should only fire after the first re-render subsequent re-render cycles
  const isFirstRun = useRef(true);
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    onTableUpdate({ allSelected, selectedCount, selectedRows, sortColumn, sortDirection, clearSelectedRows: selectedRowsFlag });
  }, [allSelected, selectedRowsFlag, onTableUpdate, selectedCount, selectedRows, sortColumn, sortDirection]);

  if (clearSelectedRows !== selectedRowsFlag) {
    dispatch({ type: 'CLEAR_SELECTED_ROWS', selectedRowsFlag: clearSelectedRows });
  }

  const enabledPagination = pagination && !progressPending && data.length > 0;
  const Pagination = paginationComponent || NativePagination;
  const decoratedColumns = useMemo(() => decorateColumns(columns), [columns]);
  const sortedData = useMemo(() => sort(data, sortColumn, sortDirection, sortFunction), [data, sortColumn, sortDirection, sortFunction]);
  const theme = useMemo(() => merge(getDefaultTheme(), customTheme), [customTheme]);
  const checkIfRowSeleted = useCallback(row => selectedRows.some(srow => srow === row), [selectedRows]);
  const handleSelectAll = () => dispatch({ type: 'SELECT_ALL', data });
  const handleRowSelected = row => dispatch({ type: 'ROW_SELECTED', data, row });
  const handleRowClicked = (row, e) => onRowClicked(row, e);
  const handleSortChange = column => {
    if (column.sortable) {
      let direction = sortDirection;
      // change sort direction only if sortColumn (currently selected column) is === the newly clicked column
      // otherwise, retain sort direction if the column is swiched
      if (sortColumn === column.selector) {
        direction = sortDirection === 'asc' ? 'desc' : 'asc';
      }

      dispatch({ type: 'SORT_CHANGE', sortDirection: direction, sortColumn: column.selector });
      onSort(column, direction);
    }
  };

  const handleChangePage = page => {
    dispatch({ type: 'CHANGE_PAGE', page });
    onChangePage(page, paginationTotalRows || data.length);
  };

  const handleChangeRowsPerPage = newRowsPerPage => {
    const rowCount = paginationTotalRows || data.length;
    const updatedPage = getNumberOfPages(rowCount, newRowsPerPage);
    const recalculatedPage = Math.min(currentPage, updatedPage);

    // update the currentPage for client-side pagination
    // server - side should be handled by onChangeRowsPerPage
    if (!paginationServer) {
      handleChangePage(recalculatedPage);
    }

    dispatch({ type: 'CHANGE_ROWS_PER_PAGE', page: recalculatedPage, rowsPerPage: newRowsPerPage });
    onChangeRowsPerPage(newRowsPerPage, recalculatedPage);
  };

  const calculateRows = () => {
    if (pagination && !paginationServer) {
      // when using client-side pagination we can just slice the data set
      const lastIndex = currentPage * rowsPerPage;
      const firstIndex = lastIndex - rowsPerPage;

      return sortedData.slice(firstIndex, lastIndex);
    }

    return sortedData;
  };

  const renderColumns = () => (
    decoratedColumns.map(column => (
      <TableCol
        key={column.id}
        column={column}
        onColumnClick={handleSortChange}
        sortIcon={sortIcon}
      />
    ))
  );

  const renderRows = () => (
    calculateRows().map((row, i) => (
      <TableRow
        key={row[keyField] || i}
        row={row}
        columns={decoratedColumns}
        keyField={keyField}
        selectableRows={selectableRows}
        expandableRows={expandableRows}
        striped={striped}
        highlightOnHover={highlightOnHover}
        pointerOnHover={pointerOnHover}
        expandableRowsComponent={expandableRowsComponent}
        expandableDisabledField={expandableDisabledField}
        defaultExpanded={row[defaultExpandedField] || false}
        onRowClicked={handleRowClicked}
        onRowSelected={handleRowSelected}
        isRowSelected={checkIfRowSeleted}
      />
    ))
  );

  const renderTableHead = () => (
    <TableHead className="rdt_TableHead">
      <TableHeadRow className="rdt_TableHeadRow">
        {selectableRows && <TableColCheckbox onClick={handleSelectAll} checked={allSelected} />}
        {expandableRows && <CellBase style={{ flex: '0 0 56px' }} />}
        {renderColumns()}
      </TableHeadRow>
    </TableHead>
  );

  return (
    <ThemeProvider theme={theme}>
      <DataTableProvider initialState={init}>
        <ResponsiveWrapper
          responsive={responsive}
          className={className}
          style={style}
          overflowYOffset={overflowYOffset}
          overflowY={overflowY}
        >
          {!noHeader && (
            <TableHeader
              title={title}
              actions={actions}
              pending={progressPending}
            />
          )}

          {subHeader && (
            <TableSubheader
              align={subHeaderAlign}
              wrapContent={subHeaderWrap}
              component={subHeaderComponent}
            />
          )}

          <TableWrapper>
            {progressPending && (
              <ProgressWrapper
                component={progressComponent}
                centered={progressCentered}
              />
            )}

            {!data.length > 0 && !progressPending &&
              <NoData component={noDataComponent} />}

            {data.length > 0 && (
              <Table
                disabled={disabled}
                className="rdt_Table"
              >
                {renderTableHead()}

                <TableBody
                  fixedHeader={fixedHeader}
                  fixedHeaderScrollHeight={fixedHeaderScrollHeight}
                  hasOffset={overflowY}
                  offset={overflowYOffset}
                  className="rdt_TableBody"
                >
                  {renderRows()}
                </TableBody>
              </Table>
            )}

            {enabledPagination && (
              <TableFooter className="rdt_TableFooter">
                <Pagination
                  onChangePage={handleChangePage}
                  onChangeRowsPerPage={handleChangeRowsPerPage}
                  rowCount={paginationTotalRows || data.length}
                  currentPage={currentPage}
                  rowsPerPage={rowsPerPage}
                  theme={theme}
                />
              </TableFooter>
            )}
          </TableWrapper>
        </ResponsiveWrapper>
      </DataTableProvider>
    </ThemeProvider>
  );
};

DataTable.propTypes = propTypes;
DataTable.defaultProps = defaultProps;

export default DataTable;
