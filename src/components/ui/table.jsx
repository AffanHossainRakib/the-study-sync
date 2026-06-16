/**
 * Table — app-canonical primitive backed by HeroUI v3 (React Aria table).
 * Supports sorting, selection and resizable columns out of the box.
 *
 *   <Table aria-label="Users" selectionMode="none">
 *     <TableHeader>
 *       <TableColumn isRowHeader>Name</TableColumn>
 *       <TableColumn>Email</TableColumn>
 *     </TableHeader>
 *     <TableBody items={rows}>
 *       {(row) => (
 *         <TableRow>
 *           <TableCell>{row.name}</TableCell>
 *           <TableCell>{row.email}</TableCell>
 *         </TableRow>
 *       )}
 *     </TableBody>
 *   </Table>
 */
export {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  TableContent,
  TableFooter,
} from "@heroui/react";
