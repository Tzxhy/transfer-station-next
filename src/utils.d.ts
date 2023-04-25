
type NonEmptyString = string

type ListDataItemWithCache<T> = T & {

	/** 是否本地添加 */
	_isLocalAdded?: boolean;
	/** 是否本地修改 */
	_isLocalChanged?: boolean;
	/** 是否本地删除 */
	_isLocalDeleted?: boolean;
}

export type Equals<X, Y> =
    (<T>() => T extends X ? 1 : 2) extends
    (<T>() => T extends Y ? 1 : 2) ? true : false;

type GetReadonlyKeys<T extends Record<string, any>> = keyof {
    [K in keyof T as (Equals<{
        [P in K]: T[P]
    }, {
        readonly [P in K]: T[P]
    }> extends true ? K : never)]: T[K] 
};

type OmitGet<T extends Record<string, any>> = Omit<T, GetReadonlyKeys<T>>