class mexDtParser {
    /**
     * Initializes the class with an array of objects (data).
     * 
     * @param {Array<Object>} data - The dataset to be processed.
     */
    constructor(data) {
        this.data = data;
        this.asyncTasks = [];
    }

    /**
     * Adds a new column to each object in the dataset.
     * 
     * @param {string} columnName - The name of the new column to be added.
     * @param {any|Function} defaultValueOrCallback - Either a static default value 
     *     or a callback function that receives the row and returns a value.
     * @returns {mexDtParser} - Returns the instance for method chaining.
     */
    addColumn(columnName, defaultValueOrCallback) {
        this.data = this.data.map(row => ({
            ...row,
            [columnName]: typeof defaultValueOrCallback === "function"
                ? defaultValueOrCallback(row)
                : defaultValueOrCallback
        }));
        return this;
    }

    /**
     * Adds a new column to each object in the dataset asynchronously.
     * Callback MUST return a Promise or async function.
     * 
     * @param {string} columnName - The name of the new column to be added.
     * @param {any|Function} asyncCallback - Either a static default value 
     *     or a callback function that receives the row and returns a value.
     * @returns {mexDtParser} - Returns the instance for method chaining.
     */
    async addColumnAsync(columnName, asyncCallback) {
        this.data = await Promise.all(
            this.data.map(async row => ({
                ...row,
                [columnName]: await asyncCallback(row)
            }))
        );

        return this;
    }

    /**
     * Edits an existing column by applying a callback function.
     * 
     * @param {string} columnName - The name of the column to edit.
     * @param {any|Function} defaultValueOrCallback - Either a static default value 
     *     and the row as arguments, and returns a new value.
     * @returns {mexDtParser} - Returns the instance for method chaining.
     */
    editColumn(columnName, defaultValueOrCallback) {   
        this.data = this.data.map(row => ({
            ...row,
            [columnName]: typeof defaultValueOrCallback === "function"
                ? defaultValueOrCallback(row[columnName], row)
                : defaultValueOrCallback
        }));
        return this;
    }

    /**
     * Edits an existing column by applying a callback function asynchronously.
     * 
     * @param {string} columnName - The name of the column to edit.
     * @param {any|Function} asyncCallback - Either a static default value 
     *     and the row as arguments, and returns a new value.
     * @returns {mexDtParser} - Returns the instance for method chaining.
     */
    async editColumnAsync(columnName, asyncCallback) {
        this.data = await Promise.all(
            this.data.map(async row => ({
                ...row,
                [columnName]: await asyncCallback(row[columnName], row)
            }))
        );

        return this;
    }

    /**
     * Deletes a specified column from each object in the dataset.
     * 
     * @param {string} columnName - The name of the column to delete.
     * @returns {mexDtParser} - Returns the instance for method chaining.
     */
    deleteColumn(columnName) {
        this.data = this.data.map(row => {
            const newRow = { ...row };
            delete newRow[columnName];
            return newRow;
        });
        return this;
    }

    /**
     * Deletes a specified column from each object in the dataset asynchronously.
     * Useful if async cleanup or conversion is required before deletion.
     * 
     * @param {string} columnName - The name of the column to delete.
     * @param {any|Function} asyncCallback - Either a static default value 
     *     and the row as arguments.
     * @returns {mexDtParser} - Returns the instance for method chaining.
     */
    async deleteColumnAsync(columnName, asyncCallback) {
        this.data = await Promise.all(
            this.data.map(async row => {
                if (typeof asyncCallback === "function") {
                    await asyncCallback(row[columnName], row);
                }
                delete row[columnName];
                return row;
            })
        );
        return this;
    }

    /**
     * Returns the modified dataset.
     * 
     * @returns {Array<Object>} - The processed dataset.
     */
    make() {
        return this.data;
    }

    /**
     * Returns processed dataset after awaiting async operations.
     */
    async makeAsync() {  
        return this.data;
    }
}

export default mexDtParser;
