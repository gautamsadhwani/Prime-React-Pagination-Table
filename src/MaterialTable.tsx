import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { Button } from 'primereact/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { OverlayPanel } from 'primereact/overlaypanel';
import { InputNumber } from 'primereact/inputnumber';

// Define the structure of the material data we expect from the API
interface Material {
  title: string;
  place_of_origin: string;
  artist_display: string;
  inscriptions?: string;
  date_start: number;
  date_end: number;
}

const MaterialTable: React.FC = () => {
  const [material, setMaterial] = useState<Material[]>([]); // Array of Material objects
  const [loading, setLoading] = useState<boolean>(true);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [first, setFirst] = useState<number>(0);
  const [rows, setRows] = useState<number>(12);
  const [selectedRows, setSelectedRows] = useState<Material[]>([]); // Array of selected Material objects
  const [rowsToSelect, setRowsToSelect] = useState<number>(0);
  const overlayRef = useRef<OverlayPanel>(null); // Use a ref for the OverlayPanel component

  // Fetch material data from API
  const fetchMaterialData = (first: number, rows: number): void => {
    setLoading(true);
    const page = Math.floor(first / rows) + 1;

    fetch(`https://api.artic.edu/api/v1/artworks?page=${page}&limit=${rows}`)
      .then((response) => response.json())
      .then((data) => {
        const uniqueMaterial: Material[] = data.data.reduce((acc: Material[], material: any) => {
            const { title, place_of_origin, artist_display, inscriptions, date_start, date_end } = material;
            // Check if the title already exists in the accumulated array
            if (!acc.some(item => item.title === title)) {
              acc.push({ title, place_of_origin, artist_display, inscriptions, date_start, date_end });
            }
            return acc;
          }, []);


        setMaterial(uniqueMaterial);
        setTotalRecords(data.pagination.total);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMaterialData(first, rows);
  }, [first, rows]);

  const onPageChange = (e: {first : number; rows: number}): void => {
    setFirst(e.first);
    setRows(e.rows);
  };

  const fetchAdditionalMaterialData = async (page: number, rows: number): Promise<Material[]> => {
    const response = await fetch(
        `https://api.artic.edu/api/v1/artworks?page=${page}&limit=${rows}`);
    const data = await response.json();
    return data.data.map((material: any) => {
      const { title, place_of_origin, artist_display, inscriptions, date_start, date_end } = material;
      return { title, place_of_origin, artist_display, inscriptions, date_start, date_end };
    });
  };

  const handleSelectRows = async (): Promise<void> => {
    const selectedCount = Math.min(rowsToSelect, totalRecords);
    const totalPages = Math.ceil(totalRecords / rows);
    let selectedRowsData: Material[] = [...material];
    let currentPage = Math.floor(first / rows) + 1;

    while (selectedRowsData.length < selectedCount && currentPage <= totalPages) {
      currentPage += 1;
      const additionalRows = await fetchAdditionalMaterialData(currentPage, rows);
      selectedRowsData = [...selectedRowsData, ...additionalRows];
    }

    setSelectedRows(selectedRowsData.slice(0, selectedCount));
    overlayRef.current?.hide();
  };

  const selectedRowsTemplate = (): JSX.Element => {
    return (
      <div className="p-grid p-nogutter">
        {selectedRows.map((row) => (
          <div key={row.title} className="p-col-12 p-md-4">
            <div className="p-card">
              <div className="p-card-header">
                <h3>{row.title}</h3>
              </div>
              <div className="p-card-body">
                <p>{row.artist_display}</p>
                <p>{row.place_of_origin}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="card">
        <DataTable
          value={material}
          paginator
          rows={rows}
          totalRecords={totalRecords}
          lazy
          first={first}
          onPage={onPageChange}
          loading={loading}
          selection={selectedRows}
          onSelectionChange={(e) => setSelectedRows(e.value as Material[])}
          dataKey="title"
          selectionMode="checkbox"

        >
          <Column selectionMode="multiple" headerStyle={{ width: '3em' }}></Column>
          <Column
            field="title"
            header={
              <div className="p-grid p-nogutter" style={{ cursor: 'pointer' }} onClick={(e) => overlayRef.current?.toggle(e)}>
                <FontAwesomeIcon icon={faChevronDown} className="p-mr-2" />
                Title
              </div>
            }
          ></Column>
          <Column field="place_of_origin" header="Place of Origin"></Column>
          <Column field="artist_display" header="Artist Display"></Column>
          <Column field="date_start" header="Date Start"></Column>
          <Column field="date_end" header="Date End"></Column>
        </DataTable>
      </div>

      <OverlayPanel ref={overlayRef} dismissable style={{ width: 400 }}>
        <h4>Select Rows...</h4>
        <InputNumber
          value={rowsToSelect}
          onValueChange={(e) => setRowsToSelect(e.value ?? 0)}
          min={0}
          max={totalRecords}
          placeholder="Select rows..."
        />
        <Button label="Enter" onClick={handleSelectRows} className="p-mt-2" />
      </OverlayPanel>

      <div className="p-mt-3">
        <h3>Selected Rows</h3>
        {selectedRows.length > 0 ? selectedRowsTemplate() : <p>No rows selected.</p>}
      </div>
    </>
  );
};

export default MaterialTable;
