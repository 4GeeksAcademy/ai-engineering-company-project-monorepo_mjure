"""Safe snippet for basic pandas cleaning."""
import sys

try:
	import pandas as pd
except ModuleNotFoundError:
	print("No se puede ejecutar la limpieza: falta la dependencia pandas.", file=sys.stderr)
	raise SystemExit(1)

def main() -> None:
	try:
		df = pd.read_csv("data.csv")
		print("df_shape", df.shape)
		print("df_dtypes", df.dtypes)

		df = df.dropna(axis=1, how="all")
		print("df_shape_after_drop_all_null_cols", df.shape)

		df.columns = df.columns.str.strip().str.lower().str.replace(" ", "_")
		print("df_columns", list(df.columns))

		before = len(df)
		df = df.drop_duplicates()
		print("rows_dropped_duplicates", before - len(df))
		print("df_head", df.head())
	except (OSError, pd.errors.ParserError, UnicodeError):
		print("No se pudo leer o procesar el archivo CSV.", file=sys.stderr)
		raise SystemExit(1)


if __name__ == "__main__":
	main()
