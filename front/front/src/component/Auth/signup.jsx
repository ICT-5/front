import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios"; // axios import
import "../../styles/Auth/signupform.css";

const API =
  import.meta.env?.VITE_API_BASE_URL ||
  process.env.REACT_APP_API_BASE_URL ||
  "http://localhost:8080";

export default function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });

  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirm: false,
  });

  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");

  const validators = {
    name: (v) => (!v ? "이름을 입력해주세요." : ""),
    email: (v) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "" : "올바른 이메일 형식이 아닙니다.",
    password: (v) => (v.length >= 4 ? "" : "비밀번호는 최소 4자 이상이어야 합니다."),
    confirm: (v, all) => (v === all.password ? "" : "비밀번호가 일치하지 않습니다."),
  };

  const validateField = (name, value, all = form) => {
    const fn = validators[name];
    if (!fn) return "";
    return fn(value, all);
  };

  const validateAll = (nextForm = form) => {
    return {
      name: validateField("name", nextForm.name, nextForm),
      email: validateField("email", nextForm.email, nextForm),
      password: validateField("password", nextForm.password, nextForm),
      confirm: validateField("confirm", nextForm.confirm, nextForm),
    };
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    const nextForm = { ...form, [name]: value };

    const nextErrors = { ...errors };
    nextErrors[name] = validateField(name, value, nextForm);

    if (name === "password" && touched.confirm) {
      nextErrors.confirm = validateField("confirm", nextForm.confirm, nextForm);
    }

    setForm(nextForm);
    setErrors(nextErrors);
  };

  const onBlur = (e) => {
    const { name } = e.target;
    setTouched((t) => ({ ...t, [name]: true }));
    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, form[name], form),
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setServerError("");

    const nextErrors = validateAll();
    setErrors(nextErrors);

    const hasError = Object.values(nextErrors).some(Boolean);
    if (hasError) return;

    try {
      const res = await axios.post(`${API}/api/users/signup`, {
        username: form.name, // API 명세 맞춤
        email: form.email,
        password: form.password,
      }, {
        // 쿠키 세션을 쓰는 경우 필요
        // withCredentials: true
      });

      if (res.status === 200 || res.status === 201) {
        navigate("/auth/profile", { replace: true });
      }
    } catch (err) {
      let message = "회원가입에 실패했어요. 잠시 후 다시 시도해주세요.";
      if (err.response) {
        if (err.response.status === 409) message = "이미 사용 중인 이메일이에요.";
        else if (err.response.status === 400) message = "요청 형식이 올바르지 않아요.";
        else if (err.response.data?.message) message = err.response.data.message;
      }
      setServerError(message);
    }
  };

  const showError = (field) => (touched[field] || submitted) && errors[field];

  return (
    <div className="auth-wrap">
      <h1 className="auth-title">회원가입</h1>

      <form className="auth-form" onSubmit={onSubmit} noValidate>
        <label>이름</label>
        <input
          name="name"
          placeholder="홍길동"
          value={form.name}
          onChange={onChange}
          onBlur={onBlur}
          className={showError("name") ? "input-error" : ""}
          required
        />
        {showError("name") && <p className="help-error">{errors.name}</p>}

        <label>이메일</label>
        <input
          name="email"
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={onChange}
          onBlur={onBlur}
          className={showError("email") ? "input-error" : ""}
          required
        />
        {showError("email") && <p className="help-error">{errors.email}</p>}

        <label>비밀번호</label>
        <input
          name="password"
          type="password"
          placeholder="4자 이상"
          value={form.password}
          onChange={onChange}
          onBlur={onBlur}
          className={showError("password") ? "input-error" : ""}
          required
        />
        {showError("password") && <p className="help-error">{errors.password}</p>}

        <label>비밀번호 확인</label>
        <input
          name="confirm"
          type="password"
          placeholder="다시 입력"
          value={form.confirm}
          onChange={onChange}
          onBlur={onBlur}
          className={showError("confirm") ? "input-error" : ""}
          required
        />
        {showError("confirm") && <p className="help-error">{errors.confirm}</p>}

        {serverError && (
          <p className="help-error" style={{ marginTop: 8 }}>
            {serverError}
          </p>
        )}

        <button type="submit" className="btn-primary btn--block">가입하기</button>
      </form>

      <div className="auth-meta">
        <span>이미 계정이 있나요?</span>
        <Link to="/auth/login" className="link">로그인</Link>
      </div>
    </div>
  );
}
