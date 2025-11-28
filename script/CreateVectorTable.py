import iris
conn = iris.connect("localhost", 32782, "DEMO", "_SYSTEM", "ISCDEMO")
cursor = conn.cursor()

table_name = "VectorSearch.DocRefVectors"

create_table_query = f"""
CREATE TABLE {table_name} (
Data LONGVARCHAR,
DataVector VECTOR(DOUBLE, 384)
)
"""

cursor.execute(f"DROP TABLE IF EXISTS {table_name}" )
cursor.execute(create_table_query)