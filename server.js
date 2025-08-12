const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const axios = require('axios');
const app = express();

app.use(cors());
app.use(express.json());

// 🔑 실제 네이버 API 정보
const API_KEY = '0100000000e61dd685a1e26eaa921a76d6bf0648066585270d190f6bf006b78ad36aa8ca66';
const SECRET_KEY = 'AQAAAADmHdaFoeJuqpIadta/BkgGL60QBUM5X5wloHQKpjpQTg==';
const CUSTOMER_ID = '1726741';

function generateSignature(timestamp, method, uri, secretKey) {
  const message = timestamp + '.' + method + '.' + uri;
  return crypto.createHmac('sha256', secretKey).update(message).digest('base64');
}

app.get('/api/keywords', async (req, res) => {
  const { keywords } = req.query;
  
  try {
    console.log(`🔍 키워드 검색 요청: ${keywords}`);
    
    const uri = '/keywordstool';
    const method = 'GET';
    const timestamp = Date.now().toString();
    const signature = generateSignature(timestamp, method, uri, SECRET_KEY);
    
    console.log('📡 네이버 API 호출 중...');
    
    const response = await axios.get('https://api.searchad.naver.com' + uri, {
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Timestamp': timestamp,
        'X-API-KEY': API_KEY,
        'X-Customer': CUSTOMER_ID,
        'X-Signature': signature
      },
      params: {
        hintKeywords: keywords,
        showDetail: 1
      }
    });

    console.log('✅ 네이버 API 응답 성공!');
    
    // 실제 네이버 검색량 데이터
    const keywordList = response.data.keywordList;
    if (keywordList && keywordList.length > 0) {
      const realData = keywordList[0];
      
      console.log(`📊 키워드: ${realData.relKeyword}`);
      console.log(`📱 모바일: ${realData.monthlyMobileQcCnt || 0}`);
      console.log(`💻 PC: ${realData.monthlyPcQcCnt || 0}`);
      
      const result = {
        keyword: realData.relKeyword,
        monthlySearchCount: {
          pc: realData.monthlyPcQcCnt || 0,
          mobile: realData.monthlyMobileQcCnt || 0,
          total: (realData.monthlyPcQcCnt || 0) + (realData.monthlyMobileQcCnt || 0)
        },
        compLevel: {
          level: realData.plAvgDepth >= 8 ? 'hard' : realData.plAvgDepth >= 5 ? 'medium' : 'easy',
          text: realData.plAvgDepth >= 8 ? '높음' : realData.plAvgDepth >= 5 ? '보통' : '낮음'
        }
      };

      res.json({ success: true, data: [result] });
    } else {
      console.log('❌ 키워드 데이터를 찾을 수 없습니다');
      res.json({ success: false, error: '키워드 데이터를 찾을 수 없습니다' });
    }
    
  } catch (error) {
    console.error('❌ API 에러:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      res.json({ success: false, error: 'API 인증 실패 - 키를 확인해주세요' });
    } else if (error.response?.status === 403) {
      res.json({ success: false, error: 'API 권한 없음' });
    } else {
      res.json({ success: false, error: 'API 호출 실패: ' + error.message });
    }
  }
});

app.listen(3000, () => {
  console.log('🚀 실제 네이버 검색량 서버 시작됨!');
  console.log('🌐 http://localhost:3000');
  console.log('✅ API 키 설정 완료');
  console.log('');
  console.log('이제 진짜 네이버 검색량을 가져옵니다! 🎉');
});