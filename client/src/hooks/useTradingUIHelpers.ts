import { useCallback, useMemo } from 'react';
import { isNum, formatKRW, formatBTC, formatPercent } from '@/utils/trading/formatters';

export const useTradingUIHelpers = (
  serverBands: any[],
  serverStatusBands: any[]
) => {
  const configuredByName = useMemo(() => {
    if (!Array.isArray(serverBands)) return {};
    return serverBands.reduce((acc: any, band: any) => {
      if (band?.name) acc[band.name] = band;
      return acc;
    }, {});
  }, [serverBands]);

  const statusById = useMemo(() => {
    if (!Array.isArray(serverStatusBands)) return {};
    return serverStatusBands.reduce((acc: any, status: any) => {
      if (status?.id) acc[status.id] = status;
      return acc;
    }, {});
  }, [serverStatusBands]);

  const statusByName = useMemo(() => {
    if (!Array.isArray(serverStatusBands)) return {};
    return serverStatusBands.reduce((acc: any, status: any) => {
      if (status?.name) acc[status.name] = status;
      return acc;
    }, {});
  }, [serverStatusBands]);

  const createCircleHTML = useCallback((label: string, valueText: string, unitText: string, sizePx: number, titleText?: string, extraStyle?: string) => {
    const safeTitle = (titleText || '').replace(/"/g, '&quot;');
    return `<div class="balance-circle" style="width:${sizePx}px;height:${sizePx}px;${extraStyle || ''}" title="${safeTitle}">
      <div class="balance-label">${label}</div>
      <div class="balance-value">${valueText}</div>
      <div class="balance-unit">${unitText}</div>
    </div>`;
  }, []);

  const updatePreviewForRow = useCallback((tr: HTMLTableRowElement) => {
    try {
      const cells = tr.querySelectorAll('td');
      if (cells.length < 6) return;

      const targetKimp = parseFloat((cells[1].querySelector('input') as HTMLInputElement)?.value || '0');
      const exitKimp = parseFloat((cells[2].querySelector('input') as HTMLInputElement)?.value || '0');
      const tolerance = parseFloat((cells[3].querySelector('input') as HTMLInputElement)?.value || '0');
      const leverage = parseFloat((cells[4].querySelector('input') as HTMLInputElement)?.value || '1');
      const amountBtc = parseFloat((cells[5].querySelector('input') as HTMLInputElement)?.value || '0');

      if (isNum(targetKimp) && isNum(exitKimp) && isNum(tolerance) && isNum(leverage) && isNum(amountBtc)) {
        const spreadEst = Math.abs(targetKimp - exitKimp);
        const profitRateEst = spreadEst * leverage;

        let previewCell = cells[8];
        if (!previewCell) {
          previewCell = document.createElement('td');
          tr.appendChild(previewCell);
        }

        previewCell.innerHTML = `
          <div class="preview-info">
            <div>스프레드: ${formatPercent(spreadEst)}</div>
            <div>예상수익률: ${formatPercent(profitRateEst)}</div>
            <div>투자금액: ${formatKRW(amountBtc * 100000000)}</div>
          </div>
        `;
      }
    } catch (error) {
      console.warn('미리보기 업데이트 실패:', error);
    }
  }, []);

  return {
    configuredByName,
    statusById,
    statusByName,
    createCircleHTML,
    updatePreviewForRow
  };
};